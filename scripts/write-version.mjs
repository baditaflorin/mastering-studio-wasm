import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(new URL('../package.json', import.meta.url)));

const version =
  process.env.VITE_APP_VERSION ?? process.env.npm_package_version ?? '0.1.0';
const commit = process.env.VITE_GIT_COMMIT ?? 'dev';

writeFileSync(
  join(root, 'docs', 'version.json'),
  `${JSON.stringify(
    {
      version,
      commit,
      builtAt: new Date().toISOString()
    },
    null,
    2
  )}\n`
);
