import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const EMOJI_REGEX =
  /\p{Extended_Pictographic}|\p{Emoji_Presentation}|\uFE0F|\u200D|[\u{1F1E6}-\u{1F1FF}]|[0-9#*]\uFE0F?\u20E3/gu;

const SURROGATE_PAIR =
  /\\u([Dd][89abAB][0-9a-fA-F]{2})\\u([Dd][c-fC-F][0-9a-fA-F]{2})|\\u\{([0-9a-fA-F]{4,})\}/g;

export const DEFAULT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.html',
  '.css',
  '.svg',
  '.webmanifest',
]);

export const DEFAULT_IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'web-build',
  'coverage',
  '.expo',
  'reference',
]);

export function decodeEscapeSequences(content) {
  return content.replace(SURROGATE_PAIR, (_, high, low, braced) => {
    if (braced) {
      try {
        return String.fromCodePoint(Number.parseInt(braced, 16));
      } catch {
        return '';
      }
    }
    const code =
      (Number.parseInt(high, 16) - 0xd800) * 0x400 +
      (Number.parseInt(low, 16) - 0xdc00) +
      0x10000;
    try {
      return String.fromCodePoint(code);
    } catch {
      return '';
    }
  });
}

export function findEmojiInLine(line, lineNumber, filePath) {
  const decoded = decodeEscapeSequences(line);
  const hits = [];
  for (const match of decoded.matchAll(EMOJI_REGEX)) {
    if (match[0]) {
      hits.push({
        file: filePath,
        line: lineNumber,
        character: match[0],
        column: match.index ?? 0,
        source: line.trim(),
      });
    }
  }
  return hits;
}

export function walkFiles(rootDir, options = {}) {
  const extensions = options.extensions ?? DEFAULT_EXTENSIONS;
  const ignoreDirs = options.ignoreDirs ?? DEFAULT_IGNORE_DIRS;
  const files = [];

  function walk(current) {
    let entries;
    try {
      entries = readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (ignoreDirs.has(entry.name)) continue;
        walk(full);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (!extensions.has(ext)) continue;
      files.push(full);
    }
  }

  walk(rootDir);
  return files.sort();
}

export function scanFile(filePath) {
  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }
  const lines = content.split(/\r?\n/);
  const hits = [];
  for (let index = 0; index < lines.length; index += 1) {
    hits.push(...findEmojiInLine(lines[index], index + 1, filePath));
  }
  return hits;
}

export function loadAllowlist(rootDir) {
  const allowPath = path.join(rootDir, 'scripts', 'emoji-allowlist.json');
  try {
    const raw = JSON.parse(readFileSync(allowPath, 'utf8'));
    return {
      files: new Set([
        ...(raw.files ?? []),
        'scripts/emoji-allowlist.json',
        'src/data/legacy-emoji-map.json',
        'docs/EMOJI_FOUND.txt',
      ]),
      patterns: (raw.patterns ?? []).map((item) => new RegExp(item, 'u')),
      characters: new Set(raw.characters ?? []),
    };
  } catch {
    return { files: new Set(), patterns: [], characters: new Set() };
  }
}

export function isAllowlisted(hit, allowlist, rootDir) {
  const relative = path.relative(rootDir, hit.file).replace(/\\/g, '/');
  if (allowlist.files.has(relative)) return true;
  if (allowlist.characters.has(hit.character)) return true;
  for (const pattern of allowlist.patterns) {
    if (pattern.test(hit.source)) return true;
  }
  return false;
}

export function scanRepository(rootDir, options = {}) {
  const allowlist = options.allowlist ?? loadAllowlist(rootDir);
  const files = walkFiles(rootDir, options);
  const all = [];
  const violations = [];
  for (const file of files) {
    const hits = scanFile(file);
    for (const hit of hits) {
      all.push(hit);
      if (!isAllowlisted(hit, allowlist, rootDir)) {
        violations.push(hit);
      }
    }
  }
  return { all, violations, fileCount: files.length };
}

export function formatReport(result, rootDir) {
  const lines = [
    `# Emoji scan`,
    ``,
    `Files scanned: ${result.fileCount}`,
    `Total emoji hits: ${result.all.length}`,
    `Violations (outside allowlist): ${result.violations.length}`,
    ``,
  ];
  if (result.all.length === 0) {
    lines.push('No emoji found.');
    return lines.join('\n');
  }
  lines.push('## All matches');
  lines.push('');
  for (const hit of result.all) {
    const rel = path.relative(rootDir, hit.file).replace(/\\/g, '/');
    const flagged = result.violations.includes(hit) ? ' [VIOLATION]' : '';
    lines.push(`${rel}:${hit.line}:${hit.column} ${JSON.stringify(hit.character)}${flagged}`);
    lines.push(`  ${hit.source}`);
  }
  return lines.join('\n');
}

export function repoRoot() {
  return path.join(__dirname, '..');
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const root = repoRoot();
  const result = scanRepository(root);
  console.log(formatReport(result, root));
  process.exit(result.violations.length > 0 ? 1 : 0);
}
