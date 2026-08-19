import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import os from 'os';

export class AuthManager {
  private authPath: string;

  constructor() {
    this.authPath = path.join(os.homedir(), '.notebooklm-mcp', 'auth.json');
  }

  async runAuthentication(onStatus?: (status: string) => void): Promise<void> {
    if (onStatus) onStatus('Launching Chromium...');
    
    const browser = await chromium.launch({ 
      headless: false,
      args: ['--disable-blink-features=AutomationControlled']
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    if (onStatus) onStatus('Loading NotebookLM...');
    await page.goto('https://notebooklm.google.com');

    if (onStatus) onStatus('Waiting for Google Login...');
    
    // Wait for the user to be logged in. 
    let isDone = false;
    try {
      await Promise.race([
        // 1. Entering the app (notebook view or dashboard)
        page.waitForURL(url => 
          url.origin === 'https://notebooklm.google.com' && 
          (url.pathname.includes('/notebook') || url.pathname === '/'), 
          { timeout: 300000 }
        ).then(() => { isDone = true; }),
        
        // 2. Main app structure (main role, notebook grid, or aria-labels)
        page.waitForSelector('div[role="main"], .notebook-grid, [aria-label*="Notebook"], [aria-label*="notebook"]', { timeout: 300000 })
          .then(() => { isDone = true; }),
        
        // 3. Account indicators (profile pic, logout links)
        page.waitForSelector('button[aria-haspopup="true"] img[src*="googleusercontent.com"], a[href*="logout"], a[href*="Logout"]', { timeout: 300000 })
          .then(() => { isDone = true; }),

        // 4. Fallback: check session cookies (language neutral)
        new Promise((resolve) => {
          const checkLoop = async () => {
            if (isDone) return;
            try {
              const cookies = await context.cookies();
              const sid = cookies.find(c => c.name === '__Secure-3PSID' || c.name === 'SID');
              if (sid && page.url().includes('notebooklm.google.com')) {
                isDone = true;
                resolve(true);
              } else {
                if (!isDone) setTimeout(checkLoop, 2000);
              }
            } catch (e) {
              isDone = true;
            }
          };
          checkLoop();
        })
      ]);

      // Ensure we actually have cookies before proceeding
      const finalCookies = await context.cookies();
      const hasSid = finalCookies.some(c => c.name === '__Secure-3PSID' || c.name === 'SID');
      
      if (!hasSid) {
        // If we don't have session cookies, we might have just landed on the landing page
        // Wait a bit more or throw to avoid saving empty/expired sessions
        if (onStatus) onStatus('Verifying session session...');
        await page.waitForTimeout(3000);
      }
      
    } catch (e) {
      throw new Error('Authentication timed out or browser was closed.');
    } finally {
      isDone = true;
    }

    // Google issues __Secure-1PSIDTS (a rotating session token) via its
    // RotateCookies mechanism, which can fire *after* the notebook UI loads.
    // Without this token, Google rejects the jar as expired even seconds after
    // a successful login. Wait for it, then ask Google to mint one if needed.
    if (onStatus) onStatus('Waiting for Google session token (__Secure-1PSIDTS)...');
    const hasPsidts = async () =>
      (await context.cookies()).some(c => c.name === '__Secure-1PSIDTS');

    const psidtsDeadline = Date.now() + 15000;
    while (!(await hasPsidts()) && Date.now() < psidtsDeadline) {
      await page.waitForTimeout(1000);
    }

    if (!(await hasPsidts())) {
      // context.request shares the browser's cookie jar, so Set-Cookie
      // responses from this call land in the context automatically.
      try {
        await context.request.post('https://accounts.google.com/RotateCookies', {
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'https://accounts.google.com',
          },
          data: '[0,"-0000000000000000000"]',
        });
      } catch {
        // Non-fatal: the MCP client also attempts RotateCookies recovery at runtime.
      }
    }

    if (onStatus) onStatus('Extracting secure session cookies...');

    // CRITICAL: Filter cookies to only those that match notebooklm.google.com
    // Playwright's context.cookies() without URL returns ALL cookies from ALL domains
    // (including accounts.google.com, youtube.com, etc.), causing duplicate cookie names
    // and conflicting session values. CDP's Network.getCookies (used by Python) only
    // returns cookies for the current page URL. We match that behavior here.
    const allCookies = await context.cookies('https://notebooklm.google.com');
    
    // Deduplicate by name (keep last value, like browsers do)
    const cookieMap = new Map<string, string>();
    for (const c of allCookies) {
      cookieMap.set(c.name, c.value);
    }
    
    // Cookies scoped to other Google hosts (e.g. LSID on accounts.google.com)
    // are missed by the URL filter above, but Google's session validation and
    // RotateCookies-based __Secure-1PSIDTS recovery depend on them.
    const CRITICAL_AUTH_COOKIES = ['__Secure-1PSIDTS', '__Secure-3PSIDTS', 'LSID'];
    const fullJar = await context.cookies();
    for (const c of fullJar) {
      if (CRITICAL_AUTH_COOKIES.includes(c.name) && !cookieMap.has(c.name)) {
        cookieMap.set(c.name, c.value);
      }
    }

    const cookieString = Array.from(cookieMap.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');

    // Validate that required session cookies are present
    const REQUIRED_COOKIES = ['SID', 'HSID', 'SSID', 'APISID', 'SAPISID'];
    const missingCookies = REQUIRED_COOKIES.filter(name => !cookieMap.has(name));
    if (missingCookies.length > 0) {
      console.error(`Warning: Missing required cookies: ${missingCookies.join(', ')}`);
    }
    if (!cookieMap.has('__Secure-1PSIDTS')) {
      console.error('Warning: Google did not issue __Secure-1PSIDTS during login. The server will attempt to mint it via RotateCookies on first use.');
    }

    console.error(`Extracted ${cookieMap.size} unique cookies for notebooklm.google.com`);

    this.saveCookies(cookieString);

    console.error(`Authentication successful! Cookies saved to ${this.authPath}`);
    await browser.close();
  }

  /**
   * Persist a cookie string to auth.json. Also used by the MCP server to save
   * refreshed cookies after a successful RotateCookies recovery.
   */
  saveCookies(cookieString: string): void {
    const authData = {
      cookies: cookieString,
      updatedAt: new Date().toISOString()
    };

    if (!fs.existsSync(path.dirname(this.authPath))) {
      fs.mkdirSync(path.dirname(this.authPath), { recursive: true });
    }

    fs.writeFileSync(this.authPath, JSON.stringify(authData, null, 2));
  }

  getSavedCookies(): string {
    if (!fs.existsSync(this.authPath)) {
      throw new Error('Authentication required. Please run notebook-mcp-auth');
    }
    const data = JSON.parse(fs.readFileSync(this.authPath, 'utf-8'));
    return data.cookies;
  }
}
