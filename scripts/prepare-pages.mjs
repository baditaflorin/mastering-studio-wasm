import { copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const indexPath = join(root, 'docs', 'index.html');
const fallbackPath = join(root, 'docs', '404.html');

if (!existsSync(indexPath)) {
  throw new Error('docs/index.html was not generated');
}

copyFileSync(indexPath, fallbackPath);
