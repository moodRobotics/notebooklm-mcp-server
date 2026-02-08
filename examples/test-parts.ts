/**
 * Interactive test script to debug each part of the NotebookLM MCP Server locally.
 * 
 * Usage:
 *   npx tsx examples/test-parts.ts              # Run all tests sequentially
 *   npx tsx examples/test-parts.ts auth          # Test only auth
 *   npx tsx examples/test-parts.ts init          # Test client initialization (CSRF)
 *   npx tsx examples/test-parts.ts list          # Test listing notebooks
 *   npx tsx examples/test-parts.ts create        # Test creating a notebook
 *   npx tsx examples/test-parts.ts sources       # Test adding sources
 *   npx tsx examples/test-parts.ts query         # Test querying a notebook
 *   npx tsx examples/test-parts.ts research      # Test research flow
 *   npx tsx examples/test-parts.ts studio        # Test studio (audio/video)
 *   npx tsx examples/test-parts.ts mindmap       # Test mind map generation
 *   npx tsx examples/test-parts.ts full          # Full workflow end-to-end
 */

import { NotebookLMClient } from '../src/client.js';
import { AuthManager } from '../src/auth.js';
import chalk from 'chalk';
import dotenv from 'dotenv';

dotenv.config();

// ─── Helpers ───────────────────────────────────────────────────────────────────

function header(title: string) {
  console.log('\n' + chalk.bgCyan.black(` ═══ ${title} ═══ `) + '\n');
}

function success(msg: string) {
  console.log(chalk.green(`  ✓ ${msg}`));
}

function info(msg: string) {
  console.log(chalk.gray(`  ℹ ${msg}`));
}

function fail(msg: string, error?: any) {
  console.log(chalk.red(`  ✗ ${msg}`));
  if (error) {
    console.log(chalk.red(`    Error: ${error.message || error}`));
    if (error.response?.status) {
      console.log(chalk.red(`    HTTP Status: ${error.response.status}`));
    }
    if (error.response?.data) {
      const data = typeof error.response.data === 'string' 
        ? error.response.data.substring(0, 500) 
        : JSON.stringify(error.response.data).substring(0, 500);
      console.log(chalk.red(`    Response: ${data}`));
    }
  }
}

function divider() {
  console.log(chalk.gray('  ' + '─'.repeat(60)));
}

// Track a notebook ID created during tests for cleanup/reuse
let testNotebookId: string | null = null;

// ─── Test Functions ────────────────────────────────────────────────────────────

async function testAuth(): Promise<string | null> {
  header('TEST: Authentication');

  // 1. Check environment variable
  const envCookies = process.env.NOTEBOOKLM_COOKIES;
  if (envCookies) {
    success(`NOTEBOOKLM_COOKIES env var found (${envCookies.length} chars)`);
    info('First 80 chars: ' + envCookies.substring(0, 80) + '...');
    return envCookies;
  } else {
    info('NOTEBOOKLM_COOKIES env var not set, checking saved auth...');
  }

  // 2. Check saved cookies
  try {
    const auth = new AuthManager();
    const cookies = auth.getSavedCookies();
    if (cookies) {
      success(`Saved cookies found (${cookies.length} chars)`);
      info('First 80 chars: ' + cookies.substring(0, 80) + '...');

      // Check key cookies
      const hasSecure3PSID = cookies.includes('__Secure-3PSID');
      const hasSID = cookies.includes('SID=');
      info(`Contains __Secure-3PSID: ${hasSecure3PSID ? '✓' : '✗'}`);
      info(`Contains SID: ${hasSID ? '✓' : '✗'}`);

      return cookies;
    }
  } catch (err: any) {
    fail('No saved cookies found', err);
  }

  fail('No authentication available. Run: npx tsx src/auth-cli.ts');
  return null;
}

async function testInit(client: NotebookLMClient): Promise<boolean> {
  header('TEST: Client Initialization (CSRF + Session)');

  try {
    info('Calling client.init() to fetch CSRF token and session ID...');
    await (client as any).init();

    const csrf = (client as any).csrfToken;
    const session = (client as any).sessionId;
    const initialized = (client as any).initialized;

    if (csrf) {
      success(`CSRF token obtained: ${csrf.substring(0, 20)}...`);
    } else {
      fail('CSRF token is null — authentication may be expired');
    }

    if (session) {
      success(`Session ID obtained: ${session.substring(0, 20)}...`);
    } else {
      info('Session ID is null (sometimes OK, may still work)');
    }

    info(`Client initialized: ${initialized}`);
    return !!csrf;
  } catch (err: any) {
    fail('Client initialization failed', err);
    return false;
  }
}

async function testListNotebooks(client: NotebookLMClient): Promise<any[]> {
  header('TEST: List Notebooks');

  try {
    info('Calling client.listNotebooks()...');
    const notebooks = await client.listNotebooks();
    success(`Found ${notebooks.length} notebooks`);

    if (notebooks.length > 0) {
      divider();
      // Show first 5
      const toShow = notebooks.slice(0, 5);
      for (const nb of toShow) {
        console.log(chalk.white(`  📓 ${nb.title}`));
        console.log(chalk.gray(`     ID: ${nb.id}`));
        console.log(chalk.gray(`     Sources: ${nb.sourceCount} | Owned: ${nb.isOwned} | Shared: ${nb.isShared}`));
        if (nb.modifiedAt) console.log(chalk.gray(`     Modified: ${nb.modifiedAt}`));
      }
      if (notebooks.length > 5) {
        info(`... and ${notebooks.length - 5} more`);
      }
    }

    return notebooks;
  } catch (err: any) {
    fail('List notebooks failed', err);
    return [];
  }
}

async function testCreateNotebook(client: NotebookLMClient): Promise<string | null> {
  header('TEST: Create Notebook');

  try {
    const title = `MCP Test ${new Date().toISOString().slice(0, 16)}`;
    info(`Creating notebook: "${title}"...`);
    const id = await client.createNotebook(title);
    success(`Notebook created! ID: ${id}`);
    testNotebookId = id;
    return id;
  } catch (err: any) {
    fail('Create notebook failed', err);
    return null;
  }
}

async function testAddSources(client: NotebookLMClient, notebookId: string): Promise<void> {
  header('TEST: Add Sources');

  // Test 1: Add pasted text
  divider();
  info('Test 1: Adding pasted text source...');
  try {
    const sourceId = await client.addTextSource(
      notebookId,
      'MCP Test Content',
      'This is a test source added by the MCP test script. It contains some sample text about artificial intelligence and machine learning.'
    );
    success(`Text source added! ID: ${sourceId}`);
  } catch (err: any) {
    fail('Add text source failed', err);
  }

  // Test 2: Add URL source
  divider();
  info('Test 2: Adding URL source (Wikipedia)...');
  try {
    const sourceId = await client.addUrlSource(notebookId, 'https://en.wikipedia.org/wiki/Model_Context_Protocol');
    success(`URL source added! ID: ${sourceId}`);
  } catch (err: any) {
    fail('Add URL source failed', err);
  }
}

async function testQuery(client: NotebookLMClient, notebookId: string): Promise<void> {
  header('TEST: Query Notebook');

  try {
    info(`Querying notebook ${notebookId}...`);
    info('Question: "What topics does this notebook cover?"');
    const response = await client.query(notebookId, 'What topics does this notebook cover?');
    success('Query returned a response!');
    divider();
    console.log(chalk.blue('  Response:'));
    const answer = response.answer || response;
    const answerStr = typeof answer === 'string' ? answer : JSON.stringify(answer);
    // Truncate if very long
    console.log(chalk.white('  ' + answerStr.substring(0, 500)));
    if (answerStr.length > 500) info('... (truncated)');
  } catch (err: any) {
    fail('Query failed', err);
  }
}

async function testResearch(client: NotebookLMClient, notebookId: string): Promise<void> {
  header('TEST: Research (Fast)');

  try {
    info('Starting fast research on "MCP Protocol"...');
    const research = await client.startResearch(notebookId, 'MCP Protocol', 'web', 'fast');
    success(`Research started! Task ID: ${research.task_id}`);

    info('Polling for results (max 60s)...');
    const startTime = Date.now();
    let completed = false;

    while (!completed && (Date.now() - startTime) < 60000) {
      const result = await client.pollResearch(notebookId);
      if (result && result.status === 'completed') {
        completed = true;
        success('Research completed!');
        if (result.sources) {
          info(`Found ${result.sources.length} sources`);
        }
      } else {
        process.stdout.write(chalk.yellow('.'));
        await new Promise(r => setTimeout(r, 3000));
      }
    }

    if (!completed) {
      info('Research still running after 60s — this is normal for deep research');
    }
  } catch (err: any) {
    fail('Research failed', err);
  }
}

async function testStudio(client: NotebookLMClient, notebookId: string): Promise<void> {
  header('TEST: Studio Status');

  try {
    info(`Checking studio status for notebook ${notebookId}...`);
    const status = await client.pollStudioStatus(notebookId);
    success(`Studio status retrieved! ${status.length} artifact(s) found.`);
    if (status.length > 0) {
      console.log(chalk.gray('  ' + JSON.stringify(status, null, 2).substring(0, 500)));
    }
  } catch (err: any) {
    fail('Studio status failed', err);
  }
}

async function testMindMap(client: NotebookLMClient, notebookId: string): Promise<void> {
  header('TEST: Mind Map');

  try {
    info('Listing notebook sources for mind map...');
    const notebooks = await client.listNotebooks();
    const nb = notebooks.find(n => n.id === notebookId);
    const sourceIds = nb?.sources?.map(s => s.id) || [];
    if (sourceIds.length === 0) {
      info('No sources in notebook — skipping mind map (needs at least 1 source)');
      return;
    }
    info(`Found ${sourceIds.length} source(s). Generating mind map...`);
    const result = await client.generateMindMap(sourceIds);
    success('Mind map generated!');
    const resultStr = JSON.stringify(result);
    console.log(chalk.gray('  ' + resultStr.substring(0, 500)));
  } catch (err: any) {
    fail('Mind map generation failed', err);
  }
}

async function testDeleteNotebook(client: NotebookLMClient, notebookId: string): Promise<void> {
  header('TEST: Delete Notebook (Cleanup)');

  try {
    info(`Deleting test notebook ${notebookId}...`);
    await client.deleteNotebook(notebookId);
    success('Notebook deleted!');
  } catch (err: any) {
    fail('Delete notebook failed', err);
  }
}

// ─── Main Runner ───────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const testName = args[0] || 'all';

  console.log(chalk.bold.magenta('\n╔══════════════════════════════════════════════════╗'));
  console.log(chalk.bold.magenta('║   NotebookLM MCP Server — Local Test Runner     ║'));
  console.log(chalk.bold.magenta('╚══════════════════════════════════════════════════╝'));
  console.log(chalk.gray(`  Test: ${testName} | Time: ${new Date().toLocaleString()}\n`));

  // Step 1: Always test auth first
  const cookies = await testAuth();
  if (!cookies) {
    console.log(chalk.red('\n❌ Cannot continue without authentication.'));
    process.exit(1);
  }

  if (testName === 'auth') return;

  // Step 2: Create client
  const client = new NotebookLMClient(cookies);

  // Step 3: Run requested tests
  const tests: Record<string, () => Promise<void>> = {
    init: async () => {
      await testInit(client);
    },

    list: async () => {
      await testInit(client);
      await testListNotebooks(client);
    },

    create: async () => {
      await testInit(client);
      const id = await testCreateNotebook(client);
      if (id) {
        info(`\n  ⚠️  Notebook "${id}" was created. Delete it manually or run: npx tsx examples/test-parts.ts full`);
      }
    },

    sources: async () => {
      await testInit(client);
      const notebooks = await testListNotebooks(client);
      const id = args[1] || notebooks[0]?.id;
      if (!id) {
        fail('No notebook ID available. Create one first or pass ID as second argument.');
        return;
      }
      info(`Using notebook: ${id}`);
      await testAddSources(client, id);
    },

    query: async () => {
      await testInit(client);
      const notebooks = await testListNotebooks(client);
      const id = args[1] || notebooks[0]?.id;
      if (!id) {
        fail('No notebook ID available.');
        return;
      }
      await testQuery(client, id);
    },

    research: async () => {
      await testInit(client);
      const notebooks = await testListNotebooks(client);
      const id = args[1] || notebooks[0]?.id;
      if (!id) {
        fail('No notebook ID available.');
        return;
      }
      await testResearch(client, id);
    },

    studio: async () => {
      await testInit(client);
      const notebooks = await testListNotebooks(client);
      const id = args[1] || notebooks[0]?.id;
      if (!id) {
        fail('No notebook ID available.');
        return;
      }
      await testStudio(client, id);
    },

    mindmap: async () => {
      await testInit(client);
      const notebooks = await testListNotebooks(client);
      const id = args[1] || notebooks[0]?.id;
      if (!id) {
        fail('No notebook ID available.');
        return;
      }
      await testMindMap(client, id);
    },

    full: async () => {
      const initOk = await testInit(client);
      if (!initOk) return;

      await testListNotebooks(client);

      const nbId = await testCreateNotebook(client);
      if (!nbId) return;

      await testAddSources(client, nbId);

      // Wait a moment for sources to be processed
      info('\n  ⏳ Waiting 5s for sources to be indexed...');
      await new Promise(r => setTimeout(r, 5000));

      await testQuery(client, nbId);
      await testStudio(client, nbId);

      // Cleanup
      await testDeleteNotebook(client, nbId);
    },

    all: async () => {
      const initOk = await testInit(client);
      if (!initOk) {
        info('Stopping — init failed.');
        return;
      }
      await testListNotebooks(client);
      // Don't create/delete by default to avoid side effects
      info('\n  💡 Run specific tests: auth, init, list, create, sources, query, research, studio, mindmap, full');
    },
  };

  const testFn = tests[testName];
  if (!testFn) {
    console.log(chalk.red(`\n  Unknown test: "${testName}"`));
    console.log(chalk.yellow('  Available: ' + Object.keys(tests).join(', ')));
    process.exit(1);
  }

  await testFn();

  console.log(chalk.bold.magenta('\n══════════════════════════════════════════════════'));
  console.log(chalk.bold.magenta('  Tests completed'));
  console.log(chalk.bold.magenta('══════════════════════════════════════════════════\n'));
}

main().catch(err => {
  console.error(chalk.red('\nFatal error:'), err);
  process.exit(1);
});
