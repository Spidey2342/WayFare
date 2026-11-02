/**
 * Copy debate-related reference slices into docs/audit/debate (read-only source).
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const outDir = path.join(root, 'docs', 'audit', 'debate');
const refDir = path.join(root, 'reference', 'design-v2');

fs.mkdirSync(outDir, { recursive: true });

const sources = [
  { file: 'PART B_ GROUPS.png', out: 'lobby-reference.png' },
  {
    file: path.join(
      'Grid_ 8pt Margin_ 20px Typography_ Poppins',
      'Inter Motion_ 1.5s sticker pop, confetti on win.png',
    ),
    out: 'debate-screen-reference.png',
    crop: { top: 400, height: 900 },
  },
];

for (const item of sources) {
  const full = path.join(refDir, item.file);
  if (!fs.existsSync(full)) {
    console.warn('Missing reference file', full);
    continue;
  }
  const dest = path.join(outDir, item.out);
  if (item.crop) {
    const meta = await sharp(full).metadata();
    const width = meta.width ?? 1200;
    const top = Math.min(item.crop.top, (meta.height ?? 0) - 1);
    const height = Math.min(item.crop.height, (meta.height ?? 0) - top);
    await sharp(full).extract({ left: 0, top, width, height }).toFile(dest);
  } else {
    await sharp(full).resize({ width: 1200 }).toFile(dest);
  }
  console.log('Wrote', dest);
}
