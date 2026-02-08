import axios from 'axios';
import { execSync, spawn } from 'child_process';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function checkForUpdates(silentStart = true) {
  try {
    // Get current version from package.json
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const currentVersion = pkg.version;

    if (!silentStart) {
      console.error(chalk.blue(`[v${currentVersion}] Comprobando actualizaciones...`));
    }

    // Get latest version from npm
    const { data } = await axios.get('https://registry.npmjs.org/notebooklm-mcp-server/latest', { timeout: 3000 });
    const latestVersion = data.version;

    if (latestVersion !== currentVersion) {
      console.error(chalk.yellow(`\n[Update] ¡Nueva versión disponible! (${latestVersion})`));
      console.error(chalk.yellow(`[Update] Actualizando y relanzando automáticamente...\n`));

      try {
        // Perform global install
        execSync('npm install -g notebooklm-mcp-server@latest', { stdio: ['ignore', 'ignore', 'inherit'] });
        
        console.error(chalk.green('[Update] Actualización completada con éxito.'));
        console.error(chalk.cyan('[Update] Relanzando aplicación...\n'));

        // Relaunch the process with the same arguments
        const args = process.argv.slice(1);
        // We use the first argument which is the path to the script or bin
        // But since we updated globally, we want to run the global command if possible
        // or just spawn the same entry point.
        const child = spawn(process.argv[0], args, {
          stdio: 'inherit',
          detached: false
        });

        child.on('exit', (code) => {
          process.exit(code || 0);
        });

        // Block this process until the new one finishes (effectively handover)
        // or just exit and let the child take over if it were detached, 
        // but inherit + blocking is cleaner for MCP.
        return new Promise(() => {}); // Never resolve, wait child
      } catch (updateError) {
        console.error(chalk.red('[Update] Error al actualizar automáticamente. Por favor, reinicia manualmente.'));
      }
    } else if (!silentStart) {
      console.error(chalk.green(`[v${currentVersion}] Estás usando la última versión.`));
    }
  } catch (error) {
    // Fail silently
  }
}
