#!/usr/bin/env node
import { AuthManager } from './auth.js';
import chalk from 'chalk';
import ora from 'ora';

export async function runAuthCli() {
  const auth = new AuthManager();
  
  // Use stderr for ALL logs to avoid breaking MCP stdout
  console.error('\n' + chalk.cyan.bold('╔═══════════════════════════════════════════╗'));
  console.error(chalk.cyan.bold('║      NotebookLM MCP Authentication        ║'));
  console.error(chalk.cyan.bold('╚═══════════════════════════════════════════╝\n'));

  try {
    await auth.runAuthentication((status) => {
      console.error(chalk.blue(`[Status] ${status}`));
    });
    console.error('\n' + chalk.green.bold('Authentication successful!'));
    console.error(chalk.white('Your session is now active. You can close any leftovers and return to your chat.'));
  } catch (error: any) {
    console.error('\n' + chalk.red.bold('Authentication failed'));
    console.error(chalk.red('Error: ') + error.message);
    process.exit(1);
  }
}

// Only auto-run when invoked as the standalone auth binary. Comparing
// import.meta.url against argv[1] breaks under esbuild bundling: inside
// dist/index.js the inlined module's import.meta.url IS dist/index.js, so
// `node dist/index.js auth` used to launch the flow twice (two browser
// windows). Matching the script basename is deterministic in both builds.
import * as path from 'path';
const entryBase = process.argv[1] ? path.basename(process.argv[1]) : '';
if (entryBase.startsWith('auth-cli') || entryBase.startsWith('notebooklm-mcp-auth')) {
  runAuthCli();
}
