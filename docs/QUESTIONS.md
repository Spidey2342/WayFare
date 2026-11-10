# Open product questions (Debate V2)

## Frame path

- Prompt path: `reference/design-v2/debate-v2/`. Repo ships **`reference/debate-v2/`**. Sliced frames: `docs/design-frames/debate-v2/`.

## Migration filenames

- Core: **`0006_debate_v2.sql`**, **`0007_debate_data_and_pause.sql`**, **`0008_debate_rules.sql`**, **`0009_seed_debate_topics.sql`**, **`0010_solo_pass_awards.sql`**.

## Remaining gaps (post-P3)

| Item | Status | Notes |
| --- | --- | --- |
| Live online D10 layout during picking | **Open** | Full **Debate Setup / TEAMS Incomplete** panel is on `/dev/debate-v2/D10`; live judge picking still uses side boards + muted footer until valid |
| Presence chip on every participant avatar (D3/D4 live) | **Open** | Session shows **your** chip; D10 list shows per-row chips |
| Group player D5 (no pause/gear/Ready) | **Open** | Player variant is timer-only debating; spec screen map |
| Email typo “Did you mean …?” Yes/No | **Open** | A1 suggests domain in sign-up; not full Yes/No link pattern |
| Pass the judge role sheet visual QA | **Open** | `PassJudgeSheet` uses list sheet style; no pixel diff to reference |
| Online O-1–O-9 / S-1–S-7 acceptance | **Open** | See `docs/DEBATE_REPORT.md` |
| Restore archived groups | **Open** | No in-app restore UI (`restore_group` RPC from 0004) |
| Server-side multi-device `connected_at` bump | **Open** | Superseded UI uses Realtime presence; DB does not rotate `connected_at` on re-login |

## Accounts-only copy changes (2026-11-04)

| Location | Was | Now |
| --- | --- | --- |
| `app/auth/welcome.tsx` | "Continue without signing in" button | Removed (accounts only) |
| `app/(tabs)/profile.tsx` privacy sheet | "Guest play stays on this device only." | "Your profile and groups sync through Supabase…" |
| `app/(tabs)/profile.tsx` log out modal | Guest progress copy | "You will sign out of your account on this device." |
| `src/features/debate/audit/DebateV2FramePreview.tsx` A3 | Guest merge sheet | Placeholder text (A3 removed per spec §15) |

## Verification (done in P3)

- Playwright D1–D10, S1–S3, O1–O3, A1–A3: **`npm run test:debate-v2-frames`** → **PASS** (2026-11-03), PNGs in `docs/audit/debate-v2/`.
- Solo + same-phone offline: **`npm run test:debate-solo-offline`**, **`npm run test:debate-pass-offline`**.

## Component sheet vs product

- C07 excluded widgets: `docs/DESIGN_CONTRACT.md` DECISION #5.
- MVP **+2 PTS**. Soft timer **3 / 5 / 10 / No limit** in sheet.

## Judge hand-over toast

- Copy: "<name> is now the judge." (on `claim_judge` / judge promotion via reload).

## S1 same-phone setup (frame gap vs Figma)

| Item | Frame S1 | Product (2026-11-10) | Review |
| --- | --- | --- | --- |
| Remove player control | Not shown | Small **×** on each added player row (`app/debate/pass/setup.tsx`) | Compare `docs/design-frames/debate-v2/S1.png` vs runtime — confirm icon placement |
| Add player input | Dashed **+ ADD PLAYER** only | Tapping reveals inline dashed row with `TextInput` + **ADD** confirm | Same screenshot diff as above |

Screenshot for review: `docs/audit/debate-v2/S1.png` (re-capture after deploy) or local `npm run test:debate-pass-setup` against served `dist`.
