import { spawnSync } from 'node:child_process';

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  [
    'jest',
    '--ci',
    '--watchAll=false',
    'src/features/decks/__tests__/content-validation-test.ts',
  ],
  { stdio: 'inherit', shell: process.platform === 'win32' },
);

process.exit(result.status ?? 1);
