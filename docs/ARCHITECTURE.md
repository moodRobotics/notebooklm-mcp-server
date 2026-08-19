# System Architecture

## Core Components

### 1. MCP Server Layer (`src/server.ts`)

Built on `@modelcontextprotocol/sdk` over stdio transport. Declares all 47 tools with JSON-Schema inputs and dispatches `tools/call` requests to the API client. Destructive tools (`notebook_delete`, `source_delete`, `note_delete`, `chat_history_delete`) gate on an explicit `confirm: true` argument.

### 2. NotebookLM API Client (`src/client.ts`, axios)

Talks to Gemini Notebook's private `batchexecute` protocol at `notebooklm.google.com`:

- **RPC transport** — `callRpc()` wraps the `wrb.fr` envelope format: obfuscated RPC IDs (see `src/constants.ts`), form-encoded `f.req` payloads, a CSRF token (`at`) scraped from the app HTML (`SNlM0e`), and the anti-XSSI chunked response parser.
- **Streaming queries** — `notebook_query` uses a separate streaming endpoint (`GenerateFreeFormStreamed`) rather than batchexecute.
- **Payload templates** — migrated (Gemini 3.5 era) backends require a nested request-options wrapper on `CREATE_NOTEBOOK` / `ADD_SOURCE`; `templateBlock()` in `src/constants.ts` is the single source of truth for it.
- **Local files** — PDF text is extracted with `pdf-parse` and ingested through the text-source RPC.

### 3. Authentication & Session Manager (`src/auth.ts` + client recovery)

- Interactive login via Playwright Chromium (`notebooklm-mcp-server auth`): captures the full cookie jar, waits for Google to issue the rotating `__Secure-1PSIDTS` session token (minting it via `RotateCookies` from inside the browser context if needed), and saves everything to `~/.notebooklm-mcp/auth.json`.
- At runtime the client auto-recovers sessions: when `__Secure-1PSIDTS` is missing or stale it POSTs `accounts.google.com/RotateCookies` with the persistent identity cookies, merges the fresh `Set-Cookie` values, and persists them back to disk. A definitive 401/403 surfaces as "re-authenticate".
- Cookies can also be pinned via the `NOTEBOOKLM_COOKIES` environment variable (disables disk persistence).

## Data Flow

1. MCP client (Claude Code, Antigravity, Gemini CLI, …) calls a tool over stdio.
2. `server.ts` validates arguments and invokes the matching `NotebookLMClient` method.
3. The client lazily initializes (fetches CSRF token + session ID from the app page, running token recovery if needed), then issues the batchexecute RPC.
4. Responses are parsed from the chunked wire format into typed structures and returned as JSON text content.

## Security Considerations

- Session cookies never leave the machine: they are stored only in `~/.notebooklm-mcp/auth.json` and sent only to `notebooklm.google.com` / `accounts.google.com` over HTTPS.
- Cookie values are never logged.
- This project uses reverse-engineered private APIs; Google may change them at any time. The `BUILD_LABEL` constant tracks Google's frontend build and may need periodic updates.
