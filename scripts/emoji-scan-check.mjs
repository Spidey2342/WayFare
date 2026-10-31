import { repoRoot, scanRepository } from './emoji-scanner.mjs';

const root = repoRoot();
const { violations } = scanRepository(root);
if (violations.length > 0) {
  for (const hit of violations) {
    console.error(`${hit.file}:${hit.line} ${JSON.stringify(hit.character)}`);
  }
  process.exit(1);
}
console.log('Emoji scan: OK (allowlist only).');
