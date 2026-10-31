import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const targets = [
  { from: join(root, 'src/data/decks'), to: join(root, 'public/data/decks') },
  { from: join(root, 'src/data/learn'), to: join(root, 'public/data/learn') },
];

for (const { from, to } of targets) {
  if (!existsSync(from)) {
    console.error(`Missing content folder: ${from}`);
    process.exit(1);
  }
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from)) {
    if (name.endsWith('.json')) {
      cpSync(join(from, name), join(to, name));
    }
  }
}

console.log('Synced deck and learn JSON into public/data for offline precache.');
