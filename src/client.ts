import axios, { AxiosInstance } from 'axios';
import {
  BASE_URL, BATCH_EXECUTE_PATH, QUERY_PATH, RPC_IDS, BUILD_LABEL, SOURCE_ADD_TIMEOUT,
  templateBlock, artifactClientOptions,
  QUIZ_QUANTITY_CODES, QUIZ_DIFFICULTY_CODES, STUDIO_VARIANT,
  EXPORT_FORMAT_CODES, CHAT_GOAL_CODES, CHAT_RESPONSE_LENGTH_CODES,
  SHARE_ACCESS, SHARE_PERMISSION_CODES,
} from './constants.js';
import { randomUUID } from 'node:crypto';
import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export interface Notebook {
  id: string;
  title: string;
  sourceCount: number;
  sources: { id: string; title: string }[];
  isOwned: boolean;
  isShared: boolean;
  createdAt: string | null;
  modifiedAt: string | null;
}

/**
 * Parse a [seconds, nanoseconds] timestamp from the API into ISO format.
 */
function parseTimestamp(tsArray: any): string | null {
  if (!Array.isArray(tsArray) || tsArray.length < 1) return null;
  const seconds = tsArray[0];
  if (typeof seconds !== 'number' || seconds < 1000000000) return null;
  try {
    return new Date(seconds * 1000).toISOString();
  } catch {
    return null;
  }
}

export type CookieProvider = () => string;
export type CookieSaver = (cookies: string) => void;

/**
 * Map a wire artifact status code to a readable string.
 * Backend enum: 0 unknown, 1 initialized/pending, 2 processing, 3 ready,
 * 4 failed, 5 suggested.
 */
function studioStatusToString(code: any): string {
  switch (code) {
    case 1: return 'pending';
    case 2: return 'in_progress';
    case 3: return 'completed';
    case 4: return 'failed';
    case 5: return 'suggested';
    default: return 'unknown';
  }
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36';

function parseCookieString(cookieString: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const part of cookieString.split(';')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    const name = part.substring(0, eq).trim();
    const value = part.substring(eq + 1).trim();
    if (name) map.set(name, value);
  }
  return map;
}

function serializeCookieMap(map: Map<string, string>): string {
  return Array.from(map.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

export class NotebookLMClient {
  private client: AxiosInstance;
  private csrfToken: string | null = null;
  private sessionId: string | null = null;
  private initialized = false;
  private reqidCounter: number;
  private cookieProvider?: CookieProvider;
  private cookieSaver?: CookieSaver;

  constructor(cookies: string) {
    this.reqidCounter = Math.floor(Math.random() * 900000 + 100000);

    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Cookie': cookies,
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Origin': BASE_URL,
        'Referer': `${BASE_URL}/`,
        'X-Same-Domain': '1',
      },
    });
  }

  /**
   * Update cookies on this client instance (e.g. after re-authentication).
   * Resets initialization so the next call re-fetches the CSRF token.
   */
  updateCookies(cookies: string): void {
    this.client.defaults.headers['Cookie'] = cookies;
    this.initialized = false;
    this.csrfToken = null;
    this.sessionId = null;
  }

  /**
   * Set a cookie provider function that will be called to reload cookies
   * from disk when authentication fails.
   */
  setCookieProvider(provider: CookieProvider): void {
    this.cookieProvider = provider;
  }

  /**
   * Set a cookie saver function that will be called to persist refreshed
   * cookies (e.g. after a successful RotateCookies recovery).
   */
  setCookieSaver(saver: CookieSaver): void {
    this.cookieSaver = saver;
  }

  private currentCookies(): Map<string, string> {
    return parseCookieString(String(this.client.defaults.headers['Cookie'] || ''));
  }

  /**
   * Mint or refresh the rotating __Secure-1PSIDTS session token via Google's
   * RotateCookies endpoint. Google requires this token alongside SID; without
   * it, even freshly extracted cookies are rejected as expired. Rotation works
   * as long as SID plus a secondary binding (OSID, or APISID+SAPISID) are
   * present in the jar.
   * Returns true if new cookie values were obtained and applied.
   */
  private async rotateCookies(): Promise<boolean> {
    const jar = this.currentCookies();
    const canRotate = jar.has('SID') && (jar.has('OSID') || (jar.has('APISID') && jar.has('SAPISID')));
    if (!canRotate) return false;

    // Only send cookies a browser would route to accounts.google.com —
    // OSID/__Secure-OSID are host-scoped to notebooklm.google.com and
    // Google rejects requests that carry them cross-host.
    const accountsJar = new Map(jar);
    accountsJar.delete('OSID');
    accountsJar.delete('__Secure-OSID');

    // Google's JSPB parser varies in what it accepts for the first field;
    // try known encodings in order and stop at the first success.
    const bodies = ['[0,"-0000000000000000000"]', '[000,"-0000000000000000000"]'];

    for (const body of bodies) {
      try {
        const response = await axios.post(
          'https://accounts.google.com/RotateCookies',
          body,
          {
            headers: {
              'Content-Type': 'application/json',
              'Origin': 'https://accounts.google.com',
              'Cookie': serializeCookieMap(accountsJar),
              'User-Agent': USER_AGENT,
            },
            maxRedirects: 0,
            timeout: 15000,
            validateStatus: () => true,
          }
        );

        if (response.status === 401 || response.status === 403) {
          // Request was understood but the session itself is invalid —
          // no amount of rotation will recover it.
          console.error(`[NotebookLM] RotateCookies rejected the session (HTTP ${response.status}). Run: notebooklm-mcp-server auth`);
          return false;
        }
        if (response.status !== 200) continue;

        const setCookieHeaders: string[] = response.headers['set-cookie'] || [];
        let updated = false;
        for (const header of setCookieHeaders) {
          const pair = header.split(';')[0];
          const eq = pair.indexOf('=');
          if (eq <= 0) continue;
          const name = pair.substring(0, eq).trim();
          const value = pair.substring(eq + 1).trim();
          if (!name || !value || value === '""') continue;
          jar.set(name, value);
          updated = true;
        }
        if (!updated) continue;

        const cookieString = serializeCookieMap(jar);
        this.updateCookies(cookieString);
        if (this.cookieSaver) {
          try {
            this.cookieSaver(cookieString);
          } catch { /* persistence is best-effort */ }
        }
        console.error('[NotebookLM] Refreshed session token via RotateCookies.');
        return true;
      } catch (e: any) {
        console.error('[NotebookLM] RotateCookies attempt failed:', e.message);
      }
    }
    return false;
  }

  /**
   * Try to reload cookies from the cookie provider (e.g. from auth.json on disk).
   * Returns true if cookies were successfully reloaded.
   */
  private tryReloadCookies(): boolean {
    if (!this.cookieProvider) return false;
    try {
      const newCookies = this.cookieProvider();
      if (newCookies) {
        this.updateCookies(newCookies);
        console.error('[NotebookLM] Reloaded cookies from disk.');
        return true;
      }
    } catch (e: any) {
      console.error('[NotebookLM] Failed to reload cookies from disk:', e.message);
    }
    return false;
  }

  /**
   * Initialize CSRF token and session ID from the main page.
   * Must be called before any RPC call.
   */
  async init(_isRetry = false): Promise<void> {
    if (this.initialized) return;

    // Google rejects a jar without the rotating __Secure-1PSIDTS token even
    // when every other cookie is fresh. Auth extraction can race Google
    // issuing it, so if it's missing, try to mint one before the first request.
    if (!_isRetry && !this.currentCookies().has('__Secure-1PSIDTS')) {
      await this.rotateCookies();
    }

    try {
      const response = await this.client.get('/', {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
        },
        maxRedirects: 5,
      });

      // Check if redirected to login
      const finalUrl = response.request?.res?.responseUrl || response.config?.url || '';
      if (typeof finalUrl === 'string' && finalUrl.includes('accounts.google.com')) {
        // Before giving up, try to refresh the rotating session token and
        // retry once — a stale/missing __Secure-1PSIDTS is recoverable.
        if (!_isRetry && await this.rotateCookies()) {
          return this.init(true);
        }
        throw new AuthenticationError(
          'Authentication expired. Run notebooklm-mcp-server auth to re-authenticate.'
        );
      }

      const html = typeof response.data === 'string' ? response.data : '';
      const csrfMatch = html.match(/"SNlM0e"\s*:\s*"([^"]+)"/);
      if (csrfMatch) {
        this.csrfToken = csrfMatch[1];
      }
      const sidMatch = html.match(/"FdrFJe"\s*:\s*"([^"]+)"/);
      if (sidMatch) {
        this.sessionId = sidMatch[1];
      }
      this.initialized = true;
      if (!this.csrfToken) {
        console.error('[NotebookLM] Warning: Could not extract CSRF token. Authentication may be expired.');
      }
    } catch (e: any) {
      if (e instanceof AuthenticationError) throw e;
      console.error('[NotebookLM] Failed to initialize session:', e.message);
    }
  }

  /**
   * Build the batchexecute request body (matching Python implementation exactly).
   * Uses compact JSON and adds trailing & like the Python version.
   */
  private buildRequestBody(rpcId: string, params: any[]): string {
    const paramsJson = JSON.stringify(params);
    const fReq = JSON.stringify([[[rpcId, paramsJson, null, "generic"]]]);

    const parts: string[] = [];
    parts.push(`f.req=${encodeURIComponent(fReq)}`);
    if (this.csrfToken) {
      parts.push(`at=${encodeURIComponent(this.csrfToken)}`);
    }
    // Trailing & matches Python urllib.parse behaviour
    return parts.join('&') + '&';
  }

  /**
   * Build the batchexecute URL with query params.
   */
  private buildUrl(rpcId: string, sourcePath: string = '/'): string {
    const params: Record<string, string> = {
      'rpcids': rpcId,
      'source-path': sourcePath,
      'bl': BUILD_LABEL,
      'hl': 'en',
      'rt': 'c',
    };
    if (this.sessionId) {
      params['f.sid'] = this.sessionId;
    }
    const qs = Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    return `${BATCH_EXECUTE_PATH}?${qs}`;
  }

  /**
   * Internal RPC executor using the standard Google batchexecute format.
   * Matches the Python _call_rpc() method.
   */
  private async callRpc(
    rpcId: string,
    params: any[],
    sourcePath: string = '/',
    timeout?: number,
    _retryCount = 0
  ): Promise<any> {
    await this.init();

    const body = this.buildRequestBody(rpcId, params);
    const url = this.buildUrl(rpcId, sourcePath);

    try {
      const response = await this.client.post(url, body, {
        timeout: timeout || 30000,
      });

      const parsed = this.parseResponse(response.data);
      const result = this.extractRpcResult(parsed, rpcId);
      return result;
    } catch (error: any) {
      const isAuthError =
        error instanceof AuthenticationError ||
        error.response?.status === 401 ||
        error.response?.status === 403;

      if (isAuthError && _retryCount < 2) {
        console.error(`[NotebookLM] Auth failure. Attempting cookie recovery (attempt ${_retryCount + 1})...`);
        // Try to reload cookies from disk (user may have run auth in another
        // process), then refresh the rotating session token.
        this.tryReloadCookies();
        await this.rotateCookies();
        this.initialized = false;
        await this.init();
        return this.callRpc(rpcId, params, sourcePath, timeout, _retryCount + 1);
      }

      if (isAuthError) {
        throw new AuthenticationError(
          'Authentication failed. Please run: notebooklm-mcp-server auth'
        );
      }

      throw error;
    }
  }

  /**
   * Parse the batchexecute response.
   * Matches Python _parse_response() exactly.
   */
  private parseResponse(data: any): any[] {
    let text = typeof data === 'string' ? data : JSON.stringify(data);

    // Remove anti-XSSI prefix
    if (text.startsWith(")]}'\n")) {
      text = text.substring(5);
    } else if (text.startsWith(")]}'\r\n")) {
      text = text.substring(6);
    }

    const lines = text.split('\n');
    const results: any[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) { i++; continue; }

      // Try to parse as byte count
      if (/^\d+$/.test(line)) {
        i++;
        if (i < lines.length) {
          try {
            const parsed = JSON.parse(lines[i]);
            results.push(parsed);
          } catch { /* not valid JSON */ }
        }
        i++;
      } else {
        // Not a byte count, try to parse as JSON
        try {
          const parsed = JSON.parse(line);
          results.push(parsed);
        } catch { /* not valid JSON */ }
        i++;
      }
    }

    return results;
  }

  /**
   * Extract the result for a specific RPC ID from the parsed response.
   * Matches Python _extract_rpc_result() exactly.
   */
  private extractRpcResult(parsedResponse: any[], rpcId: string): any {
    for (const chunk of parsedResponse) {
      if (!Array.isArray(chunk)) continue;
      for (const item of chunk) {
        if (!Array.isArray(item) || item.length < 3) continue;

        if (item[0] === 'wrb.fr' && item[1] === rpcId) {
          // Check for generic error signature (auth expired)
          // Signature: ["wrb.fr", "RPC_ID", null, null, null, [16], "generic"]
          if (item.length > 6 && item[6] === 'generic' && Array.isArray(item[5]) && item[5].includes(16)) {
            throw new AuthenticationError('RPC Error 16: Authentication expired');
          }

          const resultStr = item[2];
          if (typeof resultStr === 'string') {
            try {
              return JSON.parse(resultStr);
            } catch {
              return resultStr;
            }
          }
          return resultStr;
        }
      }
    }
    return null;
  }

  // =========================================================================
  // Notebook Operations (matching Python exactly)
  // =========================================================================

  async listNotebooks(): Promise<Notebook[]> {
    // Python: params = [None, 1, None, [2]]
    const result = await this.callRpc(RPC_IDS.LIST_NOTEBOOKS, [null, 1, null, [2]]);

    const notebooks: Notebook[] = [];
    if (!result || !Array.isArray(result)) return notebooks;

    // Response structure: result[0] = array of notebooks
    const notebookList = Array.isArray(result[0]) ? result[0] : result;

    for (const nbData of notebookList) {
      if (!Array.isArray(nbData) || nbData.length < 3) continue;

      // Python structure: [title, sources, notebook_id, emoji, null, metadata]
      const title = typeof nbData[0] === 'string' ? nbData[0] : 'Untitled';
      const sourcesData = Array.isArray(nbData[1]) ? nbData[1] : [];
      const notebookId = nbData[2];

      if (!notebookId) continue;

      let isOwned = true;
      let isShared = false;
      let createdAt: string | null = null;
      let modifiedAt: string | null = null;

      // Parse metadata at position 5
      if (nbData.length > 5 && Array.isArray(nbData[5]) && nbData[5].length > 0) {
        const metadata = nbData[5];
        // metadata[0] = ownership (1=mine, 2=shared_with_me)
        isOwned = metadata[0] === 1;
        if (metadata.length > 1) {
          isShared = !!metadata[1];
        }
        // metadata[5] = [seconds, nanos] = last modified
        if (metadata.length > 5) {
          modifiedAt = parseTimestamp(metadata[5]);
        }
        // metadata[8] = [seconds, nanos] = created
        if (metadata.length > 8) {
          createdAt = parseTimestamp(metadata[8]);
        }
      }

      // Parse sources
      const sources: { id: string; title: string }[] = [];
      for (const src of sourcesData) {
        if (!Array.isArray(src) || src.length < 2) continue;
        const srcIds = src[0];
        const srcTitle = src[1] || 'Untitled';
        const srcId = Array.isArray(srcIds) && srcIds.length > 0 ? srcIds[0] : srcIds;
        if (srcId) {
          sources.push({ id: srcId, title: srcTitle });
        }
      }

      notebooks.push({
        id: notebookId,
        title,
        sourceCount: sources.length,
        sources,
        isOwned,
        isShared,
        createdAt,
        modifiedAt,
      });
    }

    return notebooks;
  }

  /**
   * Get a single notebook's data including all source IDs.
   * Uses the GET_NOTEBOOK RPC (rLM1Ne).
   */
  async getNotebook(notebookId: string): Promise<any> {
    // Nested template block verified safe on both migrated and un-migrated cohorts.
    const result = await this.callRpc(
      RPC_IDS.GET_NOTEBOOK,
      [notebookId, null, templateBlock(), null, 0],
      `/notebook/${notebookId}`
    );
    return result;
  }

  /**
   * Extract source IDs from raw notebook data returned by getNotebook().
   * Matches Python _extract_source_ids_from_notebook().
   */
  private extractSourceIdsFromNotebook(notebookData: any): string[] {
    const sourceIds: string[] = [];
    if (!notebookData || !Array.isArray(notebookData)) return sourceIds;

    try {
      // Structure: notebookData[0] = [title, sources_array, notebook_id, ...]
      const notebookInfo = Array.isArray(notebookData[0]) ? notebookData[0] : notebookData;
      if (notebookInfo.length > 1 && Array.isArray(notebookInfo[1])) {
        const sources = notebookInfo[1];
        for (const source of sources) {
          // Each source: [[source_id], title, metadata, ...]
          if (Array.isArray(source) && source.length > 0) {
            const sourceIdWrapper = source[0];
            if (Array.isArray(sourceIdWrapper) && sourceIdWrapper.length > 0) {
              const sourceId = sourceIdWrapper[0];
              if (typeof sourceId === 'string') {
                sourceIds.push(sourceId);
              }
            }
          }
        }
      }
    } catch {
      // ignore parse errors
    }

    return sourceIds;
  }

  async createNotebook(title: string): Promise<string> {
    // Migrated backends (Gemini 3.5 era) reject the old flat [2], [1,...] tail
    // with gRPC status 3; the nested template block is what the web UI sends.
    const params = [title, null, null, templateBlock()];
    const result = await this.callRpc(RPC_IDS.CREATE_NOTEBOOK, params);
    // Response: result[2] = notebook_id (Python: nb_data[2])
    if (result && Array.isArray(result) && result.length >= 3) {
      return result[2] || '';
    }
    // Fallback: try result[0] for older formats
    return result?.[0] || '';
  }

  async deleteNotebook(notebookId: string): Promise<boolean> {
    // Python: params = [[notebook_id], [2]]
    await this.callRpc(RPC_IDS.DELETE_NOTEBOOK, [[notebookId], [2]]);
    return true;
  }

  async renameNotebook(notebookId: string, newTitle: string): Promise<boolean> {
    // Python: params = [notebook_id, [[None, None, None, [None, new_title]]]]
    const params = [notebookId, [[null, null, null, [null, newTitle]]]];
    await this.callRpc(RPC_IDS.RENAME_NOTEBOOK, params, `/notebook/${notebookId}`);
    return true;
  }

  // =========================================================================
  // Source Operations (matching Python exactly)
  // =========================================================================

  async addUrlSource(notebookId: string, url: string): Promise<string> {
    const isYoutube = url.toLowerCase().includes('youtube.com') || url.toLowerCase().includes('youtu.be');

    // YouTube: [None, ..., [url] at pos 7, ..., 1]
    // Regular: [None, None, [url], ..., 1]
    const sourceData = isYoutube
      ? [null, null, null, null, null, null, null, [url], null, null, 1]
      : [null, null, [url], null, null, null, null, null, null, null, 1];

    // Migrated backends reject the old flat [2], [1,...] tail (gRPC 5/9);
    // the nested template block matches the current web UI.
    const params = [
      [sourceData],
      notebookId,
      templateBlock()
    ];

    const result = await this.callRpc(
      RPC_IDS.ADD_SOURCE, params,
      `/notebook/${notebookId}`,
      SOURCE_ADD_TIMEOUT
    );

    // Parse response: result[0][0][0][0] = source_id
    if (result && Array.isArray(result[0])) {
      const sourceList = result[0];
      if (sourceList.length > 0 && Array.isArray(sourceList[0])) {
        return sourceList[0][0]?.[0] || '';
      }
    }
    return '';
  }

  async addTextSource(notebookId: string, title: string, content: string): Promise<string> {
    // source_data = [None, [title, text], None, 2, ..., 1] (type code 2 = pasted text)
    const sourceData = [null, [title, content], null, 2, null, null, null, null, null, null, 1];
    const params = [
      [sourceData],
      notebookId,
      templateBlock()
    ];

    const result = await this.callRpc(
      RPC_IDS.ADD_SOURCE, params,
      `/notebook/${notebookId}`,
      SOURCE_ADD_TIMEOUT
    );

    if (result && Array.isArray(result[0])) {
      const sourceList = result[0];
      if (sourceList.length > 0 && Array.isArray(sourceList[0])) {
        return sourceList[0][0]?.[0] || '';
      }
    }
    return '';
  }

  async addDriveSource(
    notebookId: string,
    documentId: string,
    title: string = 'Drive Document',
    mimeType: string = 'application/vnd.google-apps.document'
  ): Promise<string> {
    // Python: source_data = [[document_id, mime_type, 1, title], None, None, None, None, None, None, None, None, None, 1]
    const sourceData = [
      [documentId, mimeType, 1, title],
      null, null, null, null, null, null, null, null, null, 1
    ];
    const params = [
      [sourceData],
      notebookId,
      [2],
      [1, null, null, null, null, null, null, null, null, null, [1]]
    ];

    const result = await this.callRpc(
      RPC_IDS.ADD_SOURCE, params,
      `/notebook/${notebookId}`,
      SOURCE_ADD_TIMEOUT
    );

    if (result && Array.isArray(result[0])) {
      const sourceList = result[0];
      if (sourceList.length > 0 && Array.isArray(sourceList[0])) {
        return sourceList[0][0]?.[0] || '';
      }
    }
    return '';
  }

  async deleteSource(sourceId: string): Promise<boolean> {
    // Python: params = [[[source_id]], [2]]
    // Note: NO notebookId parameter - Python only sends sourceId
    await this.callRpc(RPC_IDS.DELETE_SOURCE, [[[sourceId]], [2]]);
    return true;
  }

  async syncDriveSource(sourceId: string): Promise<any> {
    // Python: params = [None, [source_id], [2]]
    // Note: NO notebookId parameter
    const result = await this.callRpc(RPC_IDS.SYNC_DRIVE_SOURCE, [null, [sourceId], [2]]);

    if (result && Array.isArray(result) && result.length > 0) {
      const sourceData = result[0];
      if (Array.isArray(sourceData) && sourceData.length >= 3) {
        return {
          id: sourceData[0]?.[0] || null,
          title: sourceData[1] || 'Unknown',
        };
      }
    }
    return null;
  }

  // =========================================================================
  // Chat Configuration (matching Python exactly)
  // =========================================================================

  async configureChatGoal(
    notebookId: string,
    goal: 'default' | 'learning_guide' | 'custom' = 'default',
    customPrompt?: string,
    responseLength: 'default' | 'longer' | 'shorter' = 'default'
  ): Promise<boolean> {
    const goalCode = CHAT_GOAL_CODES[goal] || 1;
    const lengthCode = CHAT_RESPONSE_LENGTH_CODES[responseLength] || 1;

    // Chat settings ride the generic MutateProject envelope (s0tc2d) at
    // mutation slot 7: [goal_array, [length]]. goal_array carries the custom
    // prompt only for the custom goal. Writes the whole block (no server merge).
    const goalArray: any[] = goal === 'custom' && customPrompt
      ? [goalCode, customPrompt]
      : [goalCode];
    const chatSettings = [goalArray, [lengthCode]];
    const params = [
      notebookId,
      [[null, null, null, null, null, null, null, chatSettings]],
    ];
    await this.callRpc(RPC_IDS.RENAME_NOTEBOOK, params, `/notebook/${notebookId}`);
    return true;
  }

  // =========================================================================
  // Research Operations (matching Python exactly)
  // =========================================================================

  async startResearch(
    notebookId: string,
    queryText: string,
    source: 'web' | 'drive' = 'web',
    mode: 'fast' | 'deep' = 'fast',
  ): Promise<any> {
    const sourceType = source === 'web' ? 1 : 2;
    const isDeep = mode === 'deep';
    const rpcId = isDeep ? RPC_IDS.START_DEEP_RESEARCH : RPC_IDS.START_FAST_RESEARCH;

    // Python:
    // Fast: [[query, source_type], None, 1, notebook_id]
    // Deep: [None, [1], [query, source_type], 5, notebook_id]
    const params = isDeep
      ? [null, [1], [queryText, sourceType], 5, notebookId]
      : [[queryText, sourceType], null, 1, notebookId];

    const result = await this.callRpc(rpcId, params, `/notebook/${notebookId}`);

    if (result && Array.isArray(result) && result.length > 0) {
      return {
        task_id: result[0],
        report_id: result[1] || null,
        notebook_id: notebookId,
        query: queryText,
        source,
        mode,
      };
    }
    return null;
  }

  async pollResearch(notebookId: string): Promise<any> {
    // Python: params = [None, None, notebook_id]
    const result = await this.callRpc(
      RPC_IDS.POLL_RESEARCH,
      [null, null, notebookId],
      `/notebook/${notebookId}`
    );

    if (!result || !Array.isArray(result) || result.length === 0) {
      return { status: 'no_research', message: 'No active research found' };
    }

    // Unwrap outer array if needed
    let taskList = result;
    if (Array.isArray(result[0]) && result[0].length > 0 && Array.isArray(result[0][0])) {
      taskList = result[0];
    }

    for (const taskData of taskList) {
      if (!Array.isArray(taskData) || taskData.length < 2) continue;

      const taskId = taskData[0];
      if (typeof taskId !== 'string') continue;

      const taskInfo = taskData[1];
      if (!taskInfo || !Array.isArray(taskInfo)) continue;

      const queryInfo = taskInfo[1] || null;
      const researchMode = taskInfo[2] || null;
      const sourcesAndSummary = taskInfo[3] || [];
      const statusCode = taskInfo[4] || null;

      const queryTextResult = queryInfo && queryInfo.length > 0 ? queryInfo[0] : '';
      const sourceType = queryInfo && queryInfo.length > 1 ? queryInfo[1] : 1;

      let sourcesData: any[] = [];
      let summary = '';

      if (Array.isArray(sourcesAndSummary) && sourcesAndSummary.length >= 1) {
        sourcesData = Array.isArray(sourcesAndSummary[0]) ? sourcesAndSummary[0] : [];
        if (sourcesAndSummary.length >= 2 && typeof sourcesAndSummary[1] === 'string') {
          summary = sourcesAndSummary[1];
        }
      }

      const sources: any[] = [];
      if (Array.isArray(sourcesData)) {
        for (let idx = 0; idx < sourcesData.length; idx++) {
          const src = sourcesData[idx];
          if (!Array.isArray(src) || src.length < 2) continue;

          if (src[0] === null && src.length > 1 && typeof src[1] === 'string') {
            // Deep research format
            sources.push({
              index: idx,
              url: '',
              title: src[1] || '',
              description: '',
              result_type: src[3] || 5,
            });
          } else {
            // Fast research format: [url, title, desc, type, ...]
            sources.push({
              index: idx,
              url: typeof src[0] === 'string' ? src[0] : '',
              title: src[1] || '',
              description: src[2] || '',
              result_type: typeof src[3] === 'number' ? src[3] : 1,
            });
          }
        }
      }

      // Status: 2 = completed, 6 = imported/completed, anything else = in_progress
      const status = (statusCode === 2 || statusCode === 6) ? 'completed' : 'in_progress';

      return {
        task_id: taskId,
        status,
        query: queryTextResult,
        source_type: sourceType === 1 ? 'web' : 'drive',
        mode: researchMode === 5 ? 'deep' : 'fast',
        sources,
        source_count: sources.length,
        summary,
      };
    }

    return { status: 'no_research', message: 'No active research found' };
  }

  async importResearchSources(notebookId: string, taskId: string, sources: any[]): Promise<any[]> {
    if (!sources.length) return [];

    const sourceArray: any[] = [];
    for (const src of sources) {
      const url = src.url || '';
      const title = src.title || 'Untitled';
      const resultType = src.result_type || 1;

      // Skip deep_report sources (type 5) and empty URLs
      if (resultType === 5 || !url) continue;

      if (resultType === 1) {
        // Web source
        sourceArray.push([null, null, [url, title], null, null, null, null, null, null, null, 2]);
      } else {
        // Drive source - extract doc_id from URL
        let docId: string | null = null;
        if (url.includes('id=')) {
          docId = url.split('id=').pop()?.split('&')[0] || null;
        }

        if (docId) {
          const mimeTypes: Record<number, string> = {
            2: 'application/vnd.google-apps.document',
            3: 'application/vnd.google-apps.presentation',
            8: 'application/vnd.google-apps.spreadsheet',
          };
          const mimeType = mimeTypes[resultType] || 'application/vnd.google-apps.document';
          sourceArray.push([[docId, mimeType, 1, title], null, null, null, null, null, null, null, null, null, 2]);
        } else {
          sourceArray.push([null, null, [url, title], null, null, null, null, null, null, null, 2]);
        }
      }
    }

    // Python: params = [None, [1], task_id, notebook_id, source_array]
    const params = [null, [1], taskId, notebookId, sourceArray];
    const result = await this.callRpc(
      RPC_IDS.IMPORT_RESEARCH, params,
      `/notebook/${notebookId}`,
      120000
    );

    const imported: any[] = [];
    if (result && Array.isArray(result)) {
      // Unwrap if nested
      let resultData = result;
      if (result.length > 0 && Array.isArray(result[0]) && result[0].length > 0 && Array.isArray(result[0][0])) {
        resultData = result[0];
      }

      for (const srcData of resultData) {
        if (Array.isArray(srcData) && srcData.length >= 2) {
          const srcId = srcData[0]?.[0] || null;
          const srcTitle = srcData[1] || 'Untitled';
          if (srcId) {
            imported.push({ id: srcId, title: srcTitle });
          }
        }
      }
    }
    return imported;
  }

  // =========================================================================
  // Mind Map Operations (matching Python exactly)
  // =========================================================================

  async generateMindMap(sourceIds: string[]): Promise<any> {
    const sourcesNested = sourceIds.map(sid => [[sid]]);
    const params = [
      sourcesNested,
      null, null, null, null,
      ["interactive_mindmap", [["[CONTEXT]", ""]], ""],
      null,
      [2, null, [1]]
    ];
    const result = await this.callRpc(RPC_IDS.GENERATE_MIND_MAP, params);
    if (result && Array.isArray(result) && result.length > 0) {
      const inner = Array.isArray(result[0]) ? result[0] : result;
      return {
        mind_map_json: typeof inner[0] === 'string' ? inner[0] : null,
        generation_id: inner[2]?.[0] || null,
      };
    }
    return null;
  }

  async saveMindMap(
    notebookId: string,
    mindMapJson: string,
    sourceIds: string[],
    title: string = 'Mind Map'
  ): Promise<any> {
    const sourcesSimple = sourceIds.map(sid => [sid]);
    const metadata = [2, null, null, 5, sourcesSimple];
    const params = [notebookId, mindMapJson, metadata, null, title];
    const result = await this.callRpc(
      RPC_IDS.CREATE_NOTE, params,
      `/notebook/${notebookId}`
    );
    if (result && Array.isArray(result) && result.length > 0) {
      const inner = Array.isArray(result[0]) ? result[0] : result;
      return {
        mind_map_id: inner[0] || null,
        title: inner[4] || title,
        mind_map_json: inner[1] || null,
      };
    }
    return null;
  }

  async listMindMaps(notebookId: string): Promise<any[]> {
    const result = await this.callRpc(
      RPC_IDS.GET_NOTES,
      [notebookId],
      `/notebook/${notebookId}`
    );
    if (!result || !Array.isArray(result) || !Array.isArray(result[0])) return [];

    const maps: any[] = [];
    for (const mmData of result[0]) {
      if (!Array.isArray(mmData) || mmData.length < 2) continue;
      // Skip tombstone/deleted entries (details is null)
      const details = mmData[1];
      if (details === null) continue;

      const mindMapId = mmData[0];
      if (Array.isArray(details) && details.length >= 5) {
        const createdAt = details[2] ? parseTimestamp(details[2]?.[2] || details[2]) : null;
        maps.push({
          id: mindMapId,
          title: details[4] || 'Mind Map',
          json: details[1] || null,
          created_at: createdAt,
        });
      }
    }
    return maps;
  }

  async deleteMindMap(notebookId: string, mindMapId: string): Promise<boolean> {
    // Step 1: Get timestamp from list
    const list = await this.callRpc(
      RPC_IDS.GET_NOTES,
      [notebookId],
      `/notebook/${notebookId}`
    );
    let timestamp = null;
    if (list && Array.isArray(list[0])) {
      const mm = list[0].find((e: any) => Array.isArray(e) && e[0] === mindMapId);
      if (mm?.[1]?.[2]?.[2]) {
        timestamp = mm[1][2][2];
      }
    }

    // Step 2: UUID-based deletion
    await this.callRpc(
      RPC_IDS.DELETE_NOTE,
      [notebookId, null, [mindMapId], [2]],
      `/notebook/${notebookId}`
    );

    // Step 3: Timestamp sync (ensures UI consistency)
    if (timestamp) {
      await this.callRpc(
        RPC_IDS.GET_NOTES,
        [notebookId, null, timestamp, [2]],
        `/notebook/${notebookId}`
      );
    }
    return true;
  }

  // =========================================================================
  // Studio Operations (matching Python exactly)
  // =========================================================================

  async createAudioOverview(
    notebookId: string,
    sourceIds: string[],
    language: string = 'en',
    formatCode: number = 1,
    lengthCode: number = 2,
    focusPrompt: string = ''
  ): Promise<any> {
    const sourcesNested = sourceIds.map(sid => [[sid]]);
    const sourcesSimple = sourceIds.map(sid => [sid]);

    // Python structure:
    // audio_options = [None, [focus_prompt, length_code, None, sources_simple, language, None, format_code]]
    // params = [[2], notebook_id, [None, None, STUDIO_TYPE_AUDIO(=1), sources_nested, None, None, audio_options]]
    const audioOptions = [
      null,
      [focusPrompt, lengthCode, null, sourcesSimple, language, null, formatCode]
    ];

    const params = [
      [2],
      notebookId,
      [null, null, 1, sourcesNested, null, null, audioOptions]
    ];

    const result = await this.callRpc(
      RPC_IDS.STUDIO_GENERATE, params,
      `/notebook/${notebookId}`
    );

    if (result && Array.isArray(result) && result.length > 0) {
      const artifactData = result[0];
      const artifactId = Array.isArray(artifactData) ? artifactData[0] : null;
      const statusCode = Array.isArray(artifactData) && artifactData.length > 4 ? artifactData[4] : null;
      return {
        artifact_id: artifactId,
        notebook_id: notebookId,
        type: 'audio',
        status: studioStatusToString(statusCode),
      };
    }
    return null;
  }

  async createVideoOverview(
    notebookId: string,
    sourceIds: string[],
    language: string = 'en',
    formatCode: number = 1,
    styleCode: number = 1,
    focusPrompt: string = ''
  ): Promise<any> {
    const sourcesNested = sourceIds.map(sid => [[sid]]);
    const sourcesSimple = sourceIds.map(sid => [sid]);

    // Python structure for video (studio type = 3):
    // video_options = [None, [focus_prompt, None, None, sources_simple, language, None, format_code, None, None, style_code]]
    const videoOptions = [
      null,
      [focusPrompt, null, null, sourcesSimple, language, null, formatCode, null, null, styleCode]
    ];

    const params = [
      [2],
      notebookId,
      [null, null, 3, sourcesNested, null, null, videoOptions]
    ];

    const result = await this.callRpc(
      RPC_IDS.STUDIO_GENERATE, params,
      `/notebook/${notebookId}`
    );

    if (result && Array.isArray(result) && result.length > 0) {
      const artifactData = result[0];
      const artifactId = Array.isArray(artifactData) ? artifactData[0] : null;
      const statusCode = Array.isArray(artifactData) && artifactData.length > 4 ? artifactData[4] : null;
      return {
        artifact_id: artifactId,
        notebook_id: notebookId,
        type: 'video',
        status: studioStatusToString(statusCode),
      };
    }
    return null;
  }

  async createReport(
    notebookId: string,
    sourceIds: string[],
    language: string = 'en',
    focusPrompt: string = ''
  ): Promise<any> {
    const sourcesNested = sourceIds.map(sid => [[sid]]);
    const sourcesSimple = sourceIds.map(sid => [sid]);

    // Python: studio type 2 = report
    const reportOptions = [
      null,
      [focusPrompt, null, null, sourcesSimple, language]
    ];

    const params = [
      [2],
      notebookId,
      [null, null, 2, sourcesNested, null, null, reportOptions]
    ];

    const result = await this.callRpc(
      RPC_IDS.STUDIO_GENERATE, params,
      `/notebook/${notebookId}`
    );

    if (result && Array.isArray(result) && result.length > 0) {
      const artifactData = result[0];
      return {
        artifact_id: Array.isArray(artifactData) ? artifactData[0] : null,
        notebook_id: notebookId,
        type: 'report',
        status: 'in_progress',
      };
    }
    return null;
  }

  /**
   * Flashcards and quizzes share studio type 4, distinguished by the variant
   * code at options slot [9][1][0] (flashcards=1, quiz=2). Option pair is
   * [quantity, difficulty]; it sits at index 7 for quizzes but index 6 for
   * flashcards — an asymmetry in Google's own wire format.
   */
  private async createQuizFamilyArtifact(
    notebookId: string,
    sourceIds: string[],
    variant: number,
    focusPrompt: string = '',
    quantity: string = 'standard',
    difficulty: string = 'medium'
  ): Promise<any> {
    const sourcesTriple = sourceIds.map(sid => [[sid]]);
    const optionPair = [
      QUIZ_QUANTITY_CODES[quantity] ?? 2,
      QUIZ_DIFFICULTY_CODES[difficulty] ?? 2,
    ];
    const instructions = focusPrompt || null;
    const inner = variant === STUDIO_VARIANT.QUIZ
      ? [variant, null, instructions, null, null, null, null, optionPair]
      : [variant, null, instructions, null, null, null, optionPair];

    const params = [
      artifactClientOptions(),
      notebookId,
      [null, null, 4, sourcesTriple, null, null, null, null, null, [null, inner]],
    ];

    const result = await this.callRpc(
      RPC_IDS.STUDIO_GENERATE, params,
      `/notebook/${notebookId}`
    );

    if (result && Array.isArray(result) && result.length > 0) {
      const artifactData = result[0];
      return {
        artifact_id: Array.isArray(artifactData) ? artifactData[0] : null,
        notebook_id: notebookId,
        type: variant === STUDIO_VARIANT.QUIZ ? 'quiz' : 'flashcards',
        status: 'in_progress',
      };
    }
    return null;
  }

  async createFlashcards(
    notebookId: string,
    sourceIds: string[],
    _language: string = 'en',
    focusPrompt: string = '',
    quantity: string = 'standard',
    difficulty: string = 'medium'
  ): Promise<any> {
    // Language is not part of the quiz/flashcards wire format (it follows the
    // account's output language); the parameter is kept for API compatibility.
    return this.createQuizFamilyArtifact(
      notebookId, sourceIds, STUDIO_VARIANT.FLASHCARDS, focusPrompt, quantity, difficulty
    );
  }

  async createQuiz(
    notebookId: string,
    sourceIds: string[],
    focusPrompt: string = '',
    quantity: string = 'standard',
    difficulty: string = 'medium'
  ): Promise<any> {
    return this.createQuizFamilyArtifact(
      notebookId, sourceIds, STUDIO_VARIANT.QUIZ, focusPrompt, quantity, difficulty
    );
  }

  async createInfographic(
    notebookId: string,
    sourceIds: string[],
    language: string = 'en',
    orientationCode: number = 1,
    focusPrompt: string = ''
  ): Promise<any> {
    const sourcesNested = sourceIds.map(sid => [[sid]]);
    const sourcesSimple = sourceIds.map(sid => [sid]);

    // Python: studio type 7 = infographic
    const options = [
      null,
      [focusPrompt, null, null, sourcesSimple, language, null, null, null, null, null, orientationCode]
    ];

    const params = [
      [2],
      notebookId,
      [null, null, 7, sourcesNested, null, null, options]
    ];

    const result = await this.callRpc(
      RPC_IDS.STUDIO_GENERATE, params,
      `/notebook/${notebookId}`
    );

    if (result && Array.isArray(result) && result.length > 0) {
      const artifactData = result[0];
      return {
        artifact_id: Array.isArray(artifactData) ? artifactData[0] : null,
        notebook_id: notebookId,
        type: 'infographic',
        status: 'in_progress',
      };
    }
    return null;
  }

  async createSlideDeck(
    notebookId: string,
    sourceIds: string[],
    language: string = 'en',
    focusPrompt: string = ''
  ): Promise<any> {
    const sourcesNested = sourceIds.map(sid => [[sid]]);
    const sourcesSimple = sourceIds.map(sid => [sid]);

    // Python: studio type 8 = slide_deck
    const options = [
      null,
      [focusPrompt, null, null, sourcesSimple, language]
    ];

    const params = [
      [2],
      notebookId,
      [null, null, 8, sourcesNested, null, null, options]
    ];

    const result = await this.callRpc(
      RPC_IDS.STUDIO_GENERATE, params,
      `/notebook/${notebookId}`
    );

    if (result && Array.isArray(result) && result.length > 0) {
      const artifactData = result[0];
      return {
        artifact_id: Array.isArray(artifactData) ? artifactData[0] : null,
        notebook_id: notebookId,
        type: 'slide_deck',
        status: 'in_progress',
      };
    }
    return null;
  }

  async createDataTable(
    notebookId: string,
    sourceIds: string[],
    language: string = 'en',
    focusPrompt: string = ''
  ): Promise<any> {
    const sourcesNested = sourceIds.map(sid => [[sid]]);
    const sourcesSimple = sourceIds.map(sid => [sid]);

    // Python: studio type 9 = data_table
    const options = [
      null,
      [focusPrompt, null, null, sourcesSimple, language]
    ];

    const params = [
      [2],
      notebookId,
      [null, null, 9, sourcesNested, null, null, options]
    ];

    const result = await this.callRpc(
      RPC_IDS.STUDIO_GENERATE, params,
      `/notebook/${notebookId}`
    );

    if (result && Array.isArray(result) && result.length > 0) {
      const artifactData = result[0];
      return {
        artifact_id: Array.isArray(artifactData) ? artifactData[0] : null,
        notebook_id: notebookId,
        type: 'data_table',
        status: 'in_progress',
      };
    }
    return null;
  }

  async deleteStudioArtifact(notebookId: string, artifactId: string): Promise<boolean> {
    // Python: params = [[2], notebook_id, [artifact_id]]
    await this.callRpc(
      RPC_IDS.STUDIO_DELETE,
      [[2], notebookId, [artifactId]],
      `/notebook/${notebookId}`
    );
    return true;
  }

  async pollStudioStatus(notebookId: string): Promise<any[]> {
    // Python: params = [[2], notebook_id, 'NOT artifact.status = "ARTIFACT_STATUS_SUGGESTED"']
    const params = [[2], notebookId, 'NOT artifact.status = "ARTIFACT_STATUS_SUGGESTED"'];
    const result = await this.callRpc(
      RPC_IDS.STUDIO_STATUS, params,
      `/notebook/${notebookId}`
    );

    const artifacts: any[] = [];
    if (!result || !Array.isArray(result) || result.length === 0) return artifacts;

    const artifactList = Array.isArray(result[0]) ? result[0] : result;
    for (const artifactData of artifactList) {
      if (!Array.isArray(artifactData) || artifactData.length < 5) continue;

      const typeMap: Record<number, string> = {
        1: 'audio', 2: 'report', 3: 'video', 4: 'flashcards',
        7: 'infographic', 8: 'slide_deck', 9: 'data_table',
      };

      const artifactId = artifactData[0];
      const title = artifactData[1] || '';
      const typeCode = artifactData[2] || null;
      const statusCode = artifactData[4] || null;

      // Parse content for reports, flashcards, etc.
      let content: string | null = null;
      if (artifactData.length > 7 && artifactData[7]) {
        if (Array.isArray(artifactData[7]) && artifactData[7].length > 0) {
          content = artifactData[7][0] || null;
        }
      }

      // Parse audio/video URL
      let mediaUrl: string | null = null;
      if (artifactData.length > 8 && typeof artifactData[8] === 'string') {
        mediaUrl = artifactData[8];
      }

      artifacts.push({
        artifact_id: artifactId,
        title,
        type: typeMap[typeCode as number] || 'unknown',
        status: studioStatusToString(statusCode),
        content,
        media_url: mediaUrl,
      });
    }

    return artifacts;
  }

  // =========================================================================
  // Notes (user-created content; mind maps are note-backed JSON)
  // =========================================================================

  /**
   * Parse raw GET_NOTES rows into a uniform shape. Handles both the legacy
   * [id, [id, content, metadata, null, title]] rows and the current
   * [null, [id, ...]] wrapper; skips soft-deleted rows ([id, null, 2]).
   */
  private parseNoteRows(result: any): {
    id: string; title: string; content: string | null;
    created_at: string | null; is_mind_map: boolean;
  }[] {
    if (!result || !Array.isArray(result)) return [];

    const isRowLike = (item: any) =>
      Array.isArray(item) && item.length > 0 &&
      (typeof item[0] === 'string' ||
        (item[0] === null && Array.isArray(item[1]) && typeof item[1][0] === 'string'));

    const first = result[0];
    const container = isRowLike(first) ? result : (Array.isArray(first) ? first : []);

    const notes: {
      id: string; title: string; content: string | null;
      created_at: string | null; is_mind_map: boolean;
    }[] = [];

    for (const item of container) {
      if (!isRowLike(item)) continue;
      const row = typeof item[0] === 'string' ? item : [item[1][0], item[1], ...item.slice(2)];
      const details = row[1];
      // Soft-deleted rows keep the id but clear the payload
      if (!Array.isArray(details)) continue;

      const content = typeof details[1] === 'string' ? details[1] : null;
      const title = typeof details[4] === 'string' ? details[4] : 'Untitled';
      const createdAt = details[2] ? parseTimestamp(details[2]?.[2] || details[2]) : null;

      let isMindMap = false;
      if (content) {
        const trimmed = content.trim();
        isMindMap = trimmed.startsWith('{') &&
          (trimmed.includes('"children"') || trimmed.includes('"nodes"'));
      }

      notes.push({ id: String(row[0]), title, content, created_at: createdAt, is_mind_map: isMindMap });
    }
    return notes;
  }

  /**
   * Create a note. CREATE_NOTE ignores the title server-side, so a follow-up
   * UPDATE_NOTE sets both title and content.
   */
  async createNote(notebookId: string, title: string, content: string = ''): Promise<any> {
    const result = await this.callRpc(
      RPC_IDS.CREATE_NOTE,
      [notebookId, "", [1], null, title],
      `/notebook/${notebookId}`
    );

    let noteId: string | null = null;
    if (Array.isArray(result) && result.length > 0) {
      const firstEl = result[0];
      if (Array.isArray(firstEl) && typeof firstEl[0] === 'string') {
        noteId = firstEl[0];
      } else if (typeof firstEl === 'string') {
        noteId = firstEl;
      }
    }
    if (!noteId) {
      throw new Error('CREATE_NOTE returned no usable note id; the note was not created.');
    }

    await this.updateNote(notebookId, noteId, content, title);
    return { note_id: noteId, title, notebook_id: notebookId };
  }

  async listNotes(notebookId: string): Promise<any[]> {
    const result = await this.callRpc(
      RPC_IDS.GET_NOTES,
      [notebookId],
      `/notebook/${notebookId}`
    );
    return this.parseNoteRows(result)
      .filter(n => !n.is_mind_map)
      .map(({ is_mind_map, ...note }) => note);
  }

  async updateNote(notebookId: string, noteId: string, content: string, title: string): Promise<boolean> {
    await this.callRpc(
      RPC_IDS.UPDATE_NOTE,
      [notebookId, noteId, [[[content, title, [], 0]]]],
      `/notebook/${notebookId}`
    );
    return true;
  }

  /**
   * Delete a note (soft-delete: content is cleared, the row id persists until
   * Google garbage-collects it). Notes and mind maps share this RPC.
   */
  async deleteNote(notebookId: string, noteId: string): Promise<boolean> {
    return this.deleteMindMap(notebookId, noteId);
  }

  // =========================================================================
  // Artifact content / management
  // =========================================================================

  /**
   * Fetch a studio artifact's generated content: interactive HTML for
   * quizzes/flashcards ([0][9][0]) and the JSON node tree for interactive
   * mind maps ([0][9][3]).
   */
  async getArtifactContent(notebookId: string, artifactId: string): Promise<any> {
    const result = await this.callRpc(
      RPC_IDS.GET_INTERACTIVE_HTML,
      [artifactId],
      `/notebook/${notebookId}`
    );
    const node = result?.[0]?.[9];
    if (node) {
      return {
        artifact_id: artifactId,
        html: typeof node[0] === 'string' ? node[0] : null,
        mind_map_tree: typeof node[3] === 'string' ? node[3] : null,
      };
    }
    return { artifact_id: artifactId, html: null, mind_map_tree: null, raw: result };
  }

  async renameArtifact(notebookId: string, artifactId: string, newTitle: string): Promise<boolean> {
    // Fieldmask-style update: only the title is touched.
    await this.callRpc(
      RPC_IDS.RENAME_ARTIFACT,
      [[artifactId, newTitle], [["title"]]],
      `/notebook/${notebookId}`
    );
    return true;
  }

  /**
   * Export an artifact to the user's Google Drive (Docs or Sheets).
   * Reports/notes export well to Docs; data tables to Sheets.
   */
  async exportArtifact(
    notebookId: string,
    artifactId: string,
    format: string = 'docs',
    title: string = 'Export'
  ): Promise<any> {
    const exportCode = EXPORT_FORMAT_CODES[format] ?? 1;
    const result = await this.callRpc(
      RPC_IDS.EXPORT_ARTIFACT,
      [null, artifactId, null, title, exportCode],
      `/notebook/${notebookId}`
    );
    return { artifact_id: artifactId, destination: format, result };
  }

  // =========================================================================
  // Sharing
  // =========================================================================

  async getShareStatus(notebookId: string): Promise<any> {
    const result = await this.callRpc(
      RPC_IDS.GET_SHARE_STATUS,
      [notebookId, [2]],
      `/notebook/${notebookId}`
    );
    return result;
  }

  /**
   * Enable or disable public link sharing for a notebook.
   */
  async setNotebookPublic(notebookId: string, isPublic: boolean): Promise<any> {
    const access = isPublic ? SHARE_ACCESS.ANYONE_WITH_LINK : SHARE_ACCESS.RESTRICTED;
    const params = [
      [[notebookId, null, [access], [access, ""]]],
      1,
      null,
      [2],
    ];
    await this.callRpc(RPC_IDS.SHARE_NOTEBOOK, params, `/notebook/${notebookId}`);
    return {
      notebook_id: notebookId,
      access: isPublic ? 'anyone_with_link' : 'restricted',
      url: `${BASE_URL}/notebook/${notebookId}`,
      status: await this.getShareStatus(notebookId),
    };
  }

  /**
   * Grant, update, or remove a collaborator on a notebook. The grant is an
   * upsert; role 'remove' revokes access.
   */
  async setNotebookUserPermission(
    notebookId: string,
    email: string,
    role: 'editor' | 'viewer' | 'remove',
    notify: boolean = true,
    message: string = ''
  ): Promise<any> {
    const isRemoval = role === 'remove';
    const permission = isRemoval ? 4 : (SHARE_PERMISSION_CODES[role] ?? 3);
    // Removal always sends message block [0, ""] and no notification.
    const messageBlock = isRemoval ? [0, ""] : [message ? 0 : 1, message];
    const params = [
      [[notebookId, [[email, null, permission]], null, messageBlock]],
      isRemoval ? 0 : (notify ? 1 : 0),
      null,
      [2],
    ];
    await this.callRpc(RPC_IDS.SHARE_NOTEBOOK, params, `/notebook/${notebookId}`);
    return {
      notebook_id: notebookId,
      email,
      role,
      status: await this.getShareStatus(notebookId),
    };
  }

  // =========================================================================
  // Conversation history
  // =========================================================================

  private async getLastConversationId(notebookId: string): Promise<string | null> {
    const result = await this.callRpc(
      RPC_IDS.GET_LAST_CONVERSATION_ID,
      [[], null, notebookId, 1],
      `/notebook/${notebookId}`
    );
    // Response shape: [[[conversation_id]]]
    const candidate = result?.[0]?.[0]?.[0] ?? result?.[0]?.[0] ?? null;
    return typeof candidate === 'string' ? candidate : null;
  }

  async getChatHistory(notebookId: string, limit: number = 50): Promise<any> {
    const conversationId = await this.getLastConversationId(notebookId);
    if (!conversationId) {
      return { conversation_id: null, turns: [], message: 'No conversation found for this notebook.' };
    }
    const turns = await this.callRpc(
      RPC_IDS.GET_CONVERSATION_TURNS,
      [[], null, null, conversationId, limit],
      `/notebook/${notebookId}`
    );
    return { conversation_id: conversationId, turns };
  }

  async deleteChatHistory(notebookId: string): Promise<any> {
    const conversationId = await this.getLastConversationId(notebookId);
    if (!conversationId) {
      return { deleted: false, message: 'No conversation found for this notebook.' };
    }
    await this.callRpc(
      RPC_IDS.DELETE_CHAT_HISTORY,
      [[], conversationId, null, 1],
      `/notebook/${notebookId}`
    );
    return { deleted: true, conversation_id: conversationId };
  }

  // =========================================================================
  // Source insight operations
  // =========================================================================

  /** Fetch the AI-generated guide (summary + key topics) for a source. */
  async getSourceGuide(sourceId: string): Promise<any> {
    const result = await this.callRpc(
      RPC_IDS.GET_SOURCE_GUIDE,
      [[[[sourceId]]]]
    );
    return result;
  }

  async renameSource(sourceId: string, newTitle: string): Promise<boolean> {
    await this.callRpc(
      RPC_IDS.UPDATE_SOURCE,
      [null, [sourceId], [[[newTitle]]]]
    );
    return true;
  }

  async checkSourceFreshness(sourceId: string): Promise<any> {
    const result = await this.callRpc(
      RPC_IDS.CHECK_FRESHNESS,
      [null, [sourceId], [2]]
    );
    return result;
  }

  // =========================================================================
  // Notebook insight operations
  // =========================================================================

  /** Notebook guide: overall summary plus suggested questions. */
  async summarizeNotebook(notebookId: string): Promise<any> {
    const result = await this.callRpc(
      RPC_IDS.SUMMARIZE,
      [notebookId, [2]],
      `/notebook/${notebookId}`
    );

    const outer = result?.[0];
    const summary = typeof outer?.[0]?.[0] === 'string' ? outer[0][0] : '';
    const topics: { question: string; prompt: string }[] = [];
    const topicsList = outer?.[1]?.[0];
    if (Array.isArray(topicsList)) {
      for (const topic of topicsList) {
        if (Array.isArray(topic) && topic.length >= 2) {
          topics.push({ question: topic[0], prompt: topic[1] });
        }
      }
    }
    if (!summary && topics.length === 0) {
      return { summary: '', suggested_topics: [], raw: result };
    }
    return { summary, suggested_topics: topics };
  }

  /**
   * AI-suggested prompts/questions for a notebook. mode steers the surface:
   * 4 = chat (default), 8 = quiz, 9 = flashcards, 1/2 = audio formats.
   */
  async suggestPrompts(
    notebookId: string,
    sourceIds?: string[],
    mode: number = 4,
    query?: string
  ): Promise<any> {
    if (!sourceIds || sourceIds.length === 0) {
      try {
        const notebookData = await this.getNotebook(notebookId);
        sourceIds = this.extractSourceIdsFromNotebook(notebookData);
      } catch {
        sourceIds = [];
      }
    }
    const params = [
      templateBlock(),
      notebookId,
      sourceIds.map(id => [id]),
      mode,
      null,
      query && query.trim() ? query : null,
    ];
    const result = await this.callRpc(
      RPC_IDS.SUGGEST_PROMPTS, params,
      `/notebook/${notebookId}`
    );
    return result;
  }

  // =========================================================================
  // Local File Upload
  // =========================================================================

  async uploadLocalFile(notebookId: string, filePath: string): Promise<string> {
    const absolutePath = path.resolve(filePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const ext = path.extname(absolutePath).toLowerCase();
    const fileName = path.basename(absolutePath);
    let content = '';

    if (ext === '.pdf') {
      const dataBuffer = fs.readFileSync(absolutePath);
      const data = await pdf(dataBuffer);
      content = data.text;
    } else if (['.txt', '.md', '.markdown'].includes(ext)) {
      content = fs.readFileSync(absolutePath, 'utf-8');
    } else {
      throw new Error(`Unsupported file type: ${ext}. Currently supports .pdf, .txt, .md`);
    }

    if (!content.trim()) {
      throw new Error('File is empty or contains no readable text.');
    }

    return await this.addTextSource(notebookId, fileName, content);
  }

  // =========================================================================
  // Query (uses different endpoint - matching Python exactly)
  // =========================================================================

  async query(
    notebookId: string,
    queryText: string,
    sourceIds?: string[],
    conversationId?: string,
    _retryCount = 0
  ): Promise<any> {
    await this.init();

    // Auto-fetch source_ids from notebook if not provided (matches Python behavior)
    if (!sourceIds || sourceIds.length === 0) {
      try {
        const notebookData = await this.getNotebook(notebookId);
        sourceIds = this.extractSourceIdsFromNotebook(notebookData);
        console.error(`[NotebookLM] Auto-fetched ${sourceIds.length} source IDs from notebook`);
      } catch (e: any) {
        console.error(`[NotebookLM] Warning: Could not auto-fetch source IDs: ${e.message}`);
        sourceIds = [];
      }
    }

    const cid = conversationId || randomUUID();
    // Python: sources_array = [[[sid]] for sid in source_ids] (triple nested)
    const sources = sourceIds.length > 0 ? sourceIds.map(id => [[id]]) : [];

    // Python: params = [sources_array, query_text, None, [2, null, [1]], conversation_id]
    const params = [
      sources,
      queryText,
      null,
      [2, null, [1]],
      cid
    ];

    // Python uses: f_req = [None, params_json]
    const paramsJson = JSON.stringify(params);
    const fReq = JSON.stringify([null, paramsJson]);

    const bodyParts: string[] = [];
    bodyParts.push(`f.req=${encodeURIComponent(fReq)}`);
    if (this.csrfToken) {
      bodyParts.push(`at=${encodeURIComponent(this.csrfToken)}`);
    }
    const body = bodyParts.join('&') + '&';

    this.reqidCounter += 100000;
    const urlParams: Record<string, string> = {
      'bl': BUILD_LABEL,
      'hl': 'en',
      '_reqid': String(this.reqidCounter),
      'rt': 'c',
    };
    if (this.sessionId) {
      urlParams['f.sid'] = this.sessionId;
    }

    const qs = Object.entries(urlParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
    // Use the STREAMING QUERY ENDPOINT (different from batchexecute!)
    const url = `${BASE_URL}${QUERY_PATH}?${qs}`;

    try {
      const response = await this.client.post(url, body, {
        timeout: 120000,
      });

      const answer = this.parseQueryResponse(response.data);
      return {
        answer,
        conversation_id: cid,
      };
    } catch (error: any) {
      const isAuthError =
        error instanceof AuthenticationError ||
        error.response?.status === 401 ||
        error.response?.status === 403;

      if (isAuthError && _retryCount < 2) {
        console.error(`[NotebookLM] Query auth failure. Attempting cookie recovery (attempt ${_retryCount + 1})...`);
        this.tryReloadCookies();
        await this.rotateCookies();
        this.initialized = false;
        await this.init();
        return this.query(notebookId, queryText, sourceIds, conversationId, _retryCount + 1);
      }

      if (isAuthError) {
        throw new AuthenticationError(
          'Authentication failed. Please run: notebooklm-mcp-server auth'
        );
      }

      throw error;
    }
  }

  /**
   * Parse the streaming query response.
   * Matches Python _parse_query_response() exactly.
   */
  private parseQueryResponse(data: string): string {
    if (data.startsWith(")]}'")) {
      data = data.substring(4);
    }

    const lines = data.split('\n');
    let longestAnswer = '';
    let longestThinking = '';

    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line) { i++; continue; }

      const byteCount = parseInt(line);
      if (!isNaN(byteCount) && String(byteCount) === line.trim()) {
        i++;
        if (i < lines.length) {
          const { text, isAnswer } = this.extractFromChunk(lines[i]);
          if (text) {
            if (isAnswer && text.length > longestAnswer.length) longestAnswer = text;
            else if (!isAnswer && text.length > longestThinking.length) longestThinking = text;
          }
        }
        i++;
      } else {
        const { text, isAnswer } = this.extractFromChunk(line);
        if (text) {
          if (isAnswer && text.length > longestAnswer.length) longestAnswer = text;
          else if (!isAnswer && text.length > longestThinking.length) longestThinking = text;
        }
        i++;
      }
    }

    return longestAnswer || longestThinking || 'No answer received.';
  }

  /**
   * Extract answer text from a single JSON chunk.
   * Matches Python _extract_answer_from_chunk() exactly.
   */
  private extractFromChunk(jsonStr: string): { text: string | null; isAnswer: boolean } {
    try {
      const data = JSON.parse(jsonStr);
      if (!Array.isArray(data) || data.length === 0) return { text: null, isAnswer: false };

      for (const item of data) {
        if (!Array.isArray(item) || item.length < 3) continue;
        if (item[0] !== 'wrb.fr') continue;

        const innerJsonStr = item[2];
        if (typeof innerJsonStr !== 'string') continue;

        let innerData: any;
        try {
          innerData = JSON.parse(innerJsonStr);
        } catch { continue; }

        if (Array.isArray(innerData) && innerData.length > 0) {
          const firstElem = innerData[0];
          if (Array.isArray(firstElem) && firstElem.length > 0) {
            const answerText = firstElem[0];
            if (typeof answerText === 'string' && answerText.length > 20) {
              let isAnswer = false;
              if (firstElem.length > 4 && Array.isArray(firstElem[4])) {
                const typeInfo = firstElem[4];
                isAnswer = typeInfo[typeInfo.length - 1] === 1;
              }
              return { text: answerText, isAnswer };
            }
          } else if (typeof firstElem === 'string' && firstElem.length > 20) {
            return { text: firstElem, isAnswer: false };
          }
        }
      }
    } catch { /* ignore */ }
    return { text: null, isAnswer: false };
  }

  /**
   * Force re-fetch of CSRF token and session ID.
   */
  async refreshTokens(): Promise<void> {
    this.initialized = false;
    await this.init();
  }
}
