/**
 * S-7: ensure server-owned stats are not persisted for signed-in users (static audit).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const store = readFileSync(resolve(root, 'src/store/index.ts'), 'utf8');
const pass = store.includes('stripServerOwnedForPersist');
console.log(`S-7 static audit: ${pass ? 'PASS' : 'FAIL'} — store partialize uses stripServerOwnedForPersist`);
process.exit(pass ? 0 : 1);
