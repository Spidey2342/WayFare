import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { formatReport, repoRoot, scanRepository } from './emoji-scanner.mjs';

const root = repoRoot();
const result = scanRepository(root);
const outDir = path.join(root, 'docs');
mkdirSync(outDir, { recursive: true });
const reportPath = path.join(outDir, 'EMOJI_FOUND.txt');
writeFileSync(reportPath, `${formatReport(result, root)}\n`, 'utf8');
console.log(`Wrote ${reportPath}`);
console.log(`Violations: ${result.violations.length}`);
