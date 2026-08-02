// Assembles what ships in the VSIX:
//   extension.js      bundled host code, with dependency licences appended
//   dist/webview/     one entry point per document kind, plus the stylesheet
//   dist/vendor/      the grid, kept as shipped upstream
import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');
const modules = resolve(root, 'node_modules');

// Prebuilt browser bundle: copied rather than bundled, because the webview
// loads it by script tag before the entry point runs, and both kinds share it.
const VENDOR = [
  [resolve(modules, 'tabulator-tables/dist/js/tabulator.min.js'), 'tabulator.min.js'],
  [resolve(modules, 'tabulator-tables/dist/css/tabulator.min.css'), 'tabulator.min.css'],
];

await rm(dist, { recursive: true, force: true });
await rm(resolve(root, 'extension.js'), { force: true });

// Host: runs in the extension process, with vscode provided by the editor.
await build({
  entryPoints: [resolve(root, 'src/extension.ts')],
  outfile: resolve(root, 'extension.js'),
  bundle: true,
  platform: 'node',
  target: 'node18',
  format: 'cjs',
  external: ['vscode'],
  legalComments: 'eof',
});

// Webview: one bundle per kind, each carrying the shared grid wiring.
await build({
  entryPoints: [resolve(root, 'src/webview/csv.ts'), resolve(root, 'src/webview/excel.ts')],
  outdir: resolve(dist, 'webview'),
  bundle: true,
  platform: 'browser',
  target: 'es2022',
  format: 'iife',
  legalComments: 'eof',
});

await cp(resolve(root, 'src/webview/styles.css'), resolve(dist, 'webview/styles.css'));

await mkdir(resolve(dist, 'vendor'), { recursive: true });
for (const [from, name] of VENDOR) {
  await cp(from, resolve(dist, 'vendor', name));
}

console.log('build: extension.js, dist/webview, dist/vendor');
