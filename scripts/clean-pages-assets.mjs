import { existsSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const generatedPaths = [
  'docs/404.html',
  'docs/assets',
  'docs/icons',
  'docs/index.html',
  'docs/manifest.webmanifest',
  'docs/sw.js',
  'docs/vendor',
  'docs/version.json'
];

for (const generatedPath of generatedPaths) {
  const absolutePath = join(root, generatedPath);

  if (existsSync(absolutePath)) {
    rmSync(absolutePath, { recursive: true, force: true });
  }
}
