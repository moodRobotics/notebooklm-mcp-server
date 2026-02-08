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
    
    const cookieString = Array.from(cookieMap.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');

    // Validate that required session cookies are present
    const REQUIRED_COOKIES = ['SID', 'HSID', 'SSID', 'APISID', 'SAPISID'];
    const missingCookies = REQUIRED_COOKIES.filter(name => !cookieMap.has(name));
    if (missingCookies.length > 0) {
      console.error(`Warning: Missing required cookies: ${missingCookies.join(', ')}`);
    }

    console.error(`Extracted ${cookieMap.size} unique cookies for notebooklm.google.com`);

    const authData = {
      cookies: cookieString,
      updatedAt: new Date().toISOString()
    };

    if (!fs.existsSync(path.dirname(this.authPath))) {
      fs.mkdirSync(path.dirname(this.authPath), { recursive: true });
    }

    fs.writeFileSync(this.authPath, JSON.stringify(authData, null, 2));
    
    console.error(`Authentication successful! Cookies saved to ${this.authPath}`);
    await browser.close();
  }

  getSavedCookies(): string {
    if (!fs.existsSync(this.authPath)) {
      throw new Error('Authentication required. Please run notebook-mcp-auth');
    }
    const data = JSON.parse(fs.readFileSync(this.authPath, 'utf-8'));
    return data.cookies;
  }
}
