/**
 * Slice tall design PNGs into ~1200px segments for review.
 * Usage: node scripts/slice-design-images.mjs [inputDir] [outputDir]
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const sliceHeight = 1200;
const inputDir = process.argv[2] ?? path.join(process.cwd(), 'assets');
const outputDir = process.argv[3] ?? path.join(process.cwd(), 'docs', 'audit', 'slices');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs
  .readdirSync(inputDir)
  .filter((name) => /^Flow_[A-G].*\.png$/i.test(name) || /^0[67]-.*\.png$/i.test(name));

if (files.length === 0) {
  console.log('No design PNGs found in', inputDir);
  process.exit(0);
}

for (const file of files) {
  const full = path.join(inputDir, file);
  const base = path.basename(file, path.extname(file));
  const image = sharp(full);
  const meta = await image.metadata();
  const height = meta.height ?? 0;
  const width = meta.width ?? 0;
  let top = 0;
  let index = 0;
  while (top < height) {
    const h = Math.min(sliceHeight, height - top);
    const out = path.join(outputDir, `${base}-${String(index).padStart(2, '0')}.png`);
    await sharp(full).extract({ left: 0, top, width, height: h }).toFile(out);
    top += h;
    index += 1;
  }
  console.log(`Sliced ${file} -> ${index} parts (${width}x${height})`);
}
