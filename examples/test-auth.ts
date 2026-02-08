/**
 * Diagnostic test: verify saved cookies can initialize a session.
 * Usage: npx tsx examples/test-auth.ts
 */
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import os from 'os';

const authPath = path.join(os.homedir(), '.notebooklm-mcp', 'auth.json');

if (!fs.existsSync(authPath)) {
  console.error('No auth.json found. Run: notebooklm-mcp-server auth');
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
const cookies: string = data.cookies;

console.log('=== Auth Diagnostics ===');
console.log('Updated at:', data.updatedAt);
console.log('Cookie string length:', cookies.length);

const cookiePairs = cookies.split('; ');
console.log('Cookie count:', cookiePairs.length);
console.log('Cookie names:', cookiePairs.map(c => c.split('=')[0]).join(', '));

// Check for duplicates
const names = cookiePairs.map(c => c.split('=')[0]);
const uniqueNames = new Set(names);
if (names.length !== uniqueNames.size) {
  console.warn(`\n⚠️  DUPLICATE COOKIES DETECTED: ${names.length} total, ${uniqueNames.size} unique`);
  const counts: Record<string, number> = {};
  for (const n of names) counts[n] = (counts[n] || 0) + 1;
  const dups = Object.entries(counts).filter(([, v]) => v > 1);
  console.warn('Duplicates:', dups.map(([k, v]) => `${k} x${v}`).join(', '));
}

// Check required cookies
const REQUIRED = ['SID', 'HSID', 'SSID', 'APISID', 'SAPISID'];
const missing = REQUIRED.filter(r => !uniqueNames.has(r));
if (missing.length > 0) {
  console.error(`\n❌ Missing required cookies: ${missing.join(', ')}`);
} else {
  console.log('\n✅ All required cookies present');
}

// Test init request
console.log('\n=== Testing GET notebooklm.google.com/ ===');
try {
  const response = await axios.get('https://notebooklm.google.com/', {
    headers: {
      'Cookie': cookies,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    maxRedirects: 5,
  });

  const finalUrl = response.request?.res?.responseUrl || response.config?.url || '';
  console.log('Status:', response.status);
  console.log('Final URL:', finalUrl);

  if (finalUrl.includes('accounts.google.com')) {
    console.error('\n❌ REDIRECTED to accounts.google.com — cookies are invalid/expired');
  } else {
    const html = typeof response.data === 'string' ? response.data : '';
    const hasCSRF = html.includes('SNlM0e');
    const hasSID = html.includes('FdrFJe');
    console.log('Has CSRF token (SNlM0e):', hasCSRF);
    console.log('Has session ID (FdrFJe):', hasSID);
    
    if (hasCSRF) {
      console.log('\n✅ Authentication is working! Cookies are valid.');
    } else {
      console.warn('\n⚠️  Page loaded but no CSRF token found. Auth might be partial.');
      console.log('HTML preview (first 500 chars):', html.substring(0, 500));
    }
  }
} catch (e: any) {
  console.error('Request failed:', e.message);
  if (e.response) {
    console.error('Status:', e.response.status);
    const finalUrl = e.response.request?.res?.responseUrl || '';
    console.error('Final URL:', finalUrl);
  }
}
