import * as esbuild from 'esbuild';
import * as fs from 'fs';
import { builtinModules } from 'module';

// Clean dist directory
if (fs.existsSync('dist')) {
  fs.rmSync('dist', { recursive: true });
}
fs.mkdirSync('dist');

// Node.js builtins must be external (both bare and node: prefixed)
const nodeBuiltins = [
  ...builtinModules,
  ...builtinModules.map(m => `node:${m}`),
];

// Plugin to strip shebangs from source files (we add them via banner)
const stripShebang = {
  name: 'strip-shebang',
  setup(build) {
    build.onLoad({ filter: /\.[tj]s$/ }, async (args) => {
      const source = await fs.promises.readFile(args.path, 'utf8');
      if (source.startsWith('#!')) {
        return {
          contents: source.replace(/^#!.*\n/, ''),
          loader: args.path.endsWith('.ts') ? 'ts' : 'js',
        };
      }
      return undefined;
    });
  },
};

// Provide `require` for esbuild's CJS-to-ESM shim (ESM doesn't have require natively)
const esmRequireBanner = "import { createRequire as __banner_cR } from 'module'; const require = __banner_cR(import.meta.url);";

const common = {
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'esm',
  external: ['playwright', 'pdf-parse', ...nodeBuiltins],
  sourcemap: false,
  minify: false,
  plugins: [stripShebang],
};

// Bundle main CLI entry point
await esbuild.build({
  ...common,
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  banner: { js: `#!/usr/bin/env node\n${esmRequireBanner}` },
});

// Bundle auth CLI entry point
await esbuild.build({
  ...common,
  entryPoints: ['src/auth-cli.ts'],
  outfile: 'dist/auth-cli.js',
  banner: { js: `#!/usr/bin/env node\n${esmRequireBanner}` },
});

console.log('Build complete');
