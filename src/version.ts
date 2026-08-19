import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Package version resolved at runtime from package.json, which lives one
 * level above both src/ (dev) and dist/ (published bundle). Single source of
 * truth so the CLI and MCP serverInfo versions can't drift from the
 * published package version.
 */
export const VERSION: string = (() => {
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    return JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version || '0.0.0';
  } catch {
    return '0.0.0';
  }
})();
