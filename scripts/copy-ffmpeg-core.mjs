import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));
const sourceDir = join(root, 'node_modules', '@ffmpeg', 'core', 'dist', 'umd');
const targetDir = join(root, process.argv[2] ?? 'docs/vendor/ffmpeg-core');

if (!existsSync(sourceDir)) {
  console.warn('FFmpeg core not installed yet; run npm install before build.');
  process.exit(0);
}

mkdirSync(targetDir, { recursive: true });

for (const entry of readdirSync(sourceDir)) {
  if (entry.startsWith('ffmpeg-core.')) {
    copyFileSync(join(sourceDir, entry), join(targetDir, entry));
  }
}
