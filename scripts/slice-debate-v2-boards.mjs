/**
 * Slice reference/debate-v2 board PNGs (4 phones left-to-right) into docs/design-frames/debate-v2/.
 * Board 01 -> D1-D4, 02 -> D5-D7, 03 -> D8-D10, 04 -> S1-S3, 05 -> O1-O3, 06 -> A1-A3, 07 -> component sheet (single).
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const srcDir = path.join(root, 'reference', 'debate-v2');
const outDir = path.join(root, 'docs', 'design-frames', 'debate-v2');

const boards = [
  {
    file: 'Group Debate_ Topic and Sides.png',
    frames: ['D1', 'D2', 'D3', 'D4'],
  },
  {
    file: 'Group Debate_ Progress and Verdict.png',
    frames: ['D5', 'D6', 'D7'],
  },
  {
    file: 'Group Debate_ Results and Edge States.png',
    frames: ['D8', 'D9', 'D10'],
  },
  {
    file: 'Same-Phone Debate Flow.png',
    frames: ['S1', 'S2', 'S3'],
  },
  {
    file: 'Solo Debate Flow.png',
    frames: ['O1', 'O2', 'O3'],
  },
  {
    file: 'Account States and Merging.png',
    frames: ['A1', 'A2', 'A3'],
  },
  {
    file: 'Debate v2 Component Sheet.png',
    frames: ['C07'],
  },
];

fs.mkdirSync(outDir, { recursive: true });

for (const board of boards) {
  const input = path.join(srcDir, board.file);
  if (!fs.existsSync(input)) {
    console.error('Missing board:', input);
    process.exitCode = 1;
    continue;
  }
  const meta = await sharp(input).metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const count = board.frames.length;
  const sliceWidth = Math.floor(width / count);
  for (let i = 0; i < count; i += 1) {
    const id = board.frames[i];
    const left = i * sliceWidth;
    const w = i === count - 1 ? width - left : sliceWidth;
    const out = path.join(outDir, `${id}.png`);
    await sharp(input).extract({ left, top: 0, width: w, height }).png().toFile(out);
    console.log('Wrote', path.relative(root, out), `${w}x${height}`);
  }
}
