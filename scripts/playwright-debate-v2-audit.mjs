/**
 * Captures debate v2 contract strings at 390x844. Set AUDIT_BASE_URL to exported web dist.
 */
import { mkdir } from 'node:fs/promises';

const base = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173';
const outDir = 'docs/audit/debate-v2';

await mkdir(outDir, { recursive: true });
console.log(`debate-v2 audit: open ${base}/debate and capture manually until E2E auth is wired. Target dir: ${outDir}`);
