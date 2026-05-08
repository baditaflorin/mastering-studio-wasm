import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));

const version =
  process.env.VITE_APP_VERSION ?? process.env.npm_package_version ?? '0.1.0';
const commit = process.env.VITE_GIT_COMMIT ?? 'dev';
const versionPath = join(root, 'docs', 'version.json');
let builtAt = process.env.BUILD_AT ?? new Date().toISOString();

if (!process.env.BUILD_AT && existsSync(versionPath)) {
  try {
    const current = JSON.parse(readFileSync(versionPath, 'utf8'));

    if (current.version === version && current.commit === commit && current.builtAt) {
      builtAt = current.builtAt;
    }
  } catch {
    builtAt = new Date().toISOString();
  }
}

writeFileSync(
  versionPath,
  `${JSON.stringify(
    {
      version,
      commit,
      builtAt
    },
    null,
    2
  )}\n`
);
