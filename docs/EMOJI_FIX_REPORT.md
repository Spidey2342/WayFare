# Emoji and theme fix report

## Step 1: Emoji inventory

- Scanner: `scripts/find-emoji.mjs` (shared logic in `scripts/emoji-scanner.mjs`)
- Full listing: `docs/EMOJI_FOUND.txt` (regenerated after fixes)
- **Before fixes:** UI emoji in dev kit badge samples, Dice bless glyph, and stale audit notes; badges were already Lucide keys but tiles used theme `surface` (dark when system dark).
- **After fixes:** **0 scanner violations** outside the allowlist.

## Step 2–3: Badges

- `src/data/badges.json`: each badge has `icon` (Lucide key) + `color` (palette token).
- `src/components/ui/BadgeIcon.tsx` + `BadgeTile.tsx`: vector icons in tinted circles; white tiles on light canvas; lock overlay when locked.
- `src/data/legacy-emoji-map.json` + store v4 migration: legacy emoji badge keys map to stable ids without dropping earned badges.
- Profile and Journey use the same tile styling; Profile shows **Your badges · N / 24**.

## Step 4: Other replacements

- Dice bless face: Lucide `Sparkles` + label (no `✶`).
- Dev kit: Lucide badge samples.
- Community reactions: custom SVG glyphs in `ReactionIcon.tsx`.
- Allowed UI emoji only per `scripts/emoji-allowlist.json`:
  - Home greeting wave
  - Share default caption hands

## Step 5: Regression guards

- `npm test` runs Jest then `npm run test:emoji` (repo scan).
- `npm run build:web` runs `test:emoji` before export.
- `npm run test:e2e:emoji`: Playwright visits all primary routes at 390×844 and fails on visible emoji outside the allowlist.

## Step 6: Light-first theme

- Default preference: **light** (`ThemeProvider` default + persisted default).
- System appearance only applies when the user selects **System** in Profile.
- Profile: dark hero header; badges and settings on `#F8F9FA` with white cards.
- Home, Decks, Journey: explicit off-white screen backgrounds; Continue Journey card stays dark per design.

## Step 7: Verification

| Check | Result |
| ----- | ------ |
| `npm test` | 41 passed + emoji scan OK |
| `npm run lint` | 0 warnings |
| `npm run typecheck` | OK |
| `npm run build:web` | OK |
| `npm run test:e2e:emoji` | 0 violations on all routes (+ gameplay via setup) |
| Screenshots | `docs/audit/after/home.png`, `profile.png`, `journey.png` |

## Commands

```bash
npm run find:emoji          # refresh docs/EMOJI_FOUND.txt
npm run test:e2e:emoji      # Playwright (serve dist on :4173 first)
npm run audit:after         # after screenshots
```
