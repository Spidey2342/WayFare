/**
 * 12-user online debate load test (O-1). Delegates to debate-v2-acceptance.mjs.
 * Requires .env.test — see .env.test.example.
 */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const script = resolve(process.cwd(), 'scripts/debate-v2-acceptance.mjs');
const result = spawnSync(process.execPath, [script], { stdio: 'inherit' });
process.exit(result.status ?? 1);
