import { readFileSync } from 'node:fs';

const file = process.argv[2];

if (!file) {
  console.error('Missing commit message file');
  process.exit(1);
}

const message = readFileSync(file, 'utf8').trim();
const firstLine = message.split('\n')[0] ?? '';
const pattern =
  /^(feat|fix|docs|chore|refactor|test|ops|data|build|ci|perf|style)(\([a-z0-9-]+\))?: .{1,120}$/;

if (!pattern.test(firstLine)) {
  console.error(
    'Commit message must use Conventional Commits, e.g. "feat: add export controls"'
  );
  process.exit(1);
}
