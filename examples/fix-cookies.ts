import * as fs from 'fs';
import * as path from 'path';
import os from 'os';

const authPath = path.join(os.homedir(), '.notebooklm-mcp', 'auth.json');
const data = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
const pairs: string[] = data.cookies.split('; ');

// Deduplicate keeping first occurrence (more likely from .google.com domain)
const seen = new Map<string, string>();
for (const pair of pairs) {
  const eq = pair.indexOf('=');
  const name = pair.substring(0, eq);
  const value = pair.substring(eq + 1);
  if (!seen.has(name)) {
    seen.set(name, value);
  }
}

const deduped = Array.from(seen.entries()).map(([n, v]) => `${n}=${v}`).join('; ');
console.log(`Before: ${pairs.length} cookies`);
console.log(`After: ${seen.size} cookies`);

const newData = { cookies: deduped, updatedAt: new Date().toISOString() };
fs.writeFileSync(authPath, JSON.stringify(newData, null, 2));
console.log('Saved deduplicated cookies to auth.json');
