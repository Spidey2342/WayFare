# Open product questions (Debate V2)

## Frame path

- Spec references `reference/design-v2/debate-v2/` numbered PNGs 1–20. That folder is **not present** in the repo.
- UI is built from `reference/debate designs/` (read-only). Missing per-frame numbering vs spec; audit screenshots may not map 1:1 to "frame N".

## Migration filename

- Spec asked for `0005_debate_v2.sql`. **`0005_merge_before_unique_index.sql` already exists** (applied or pending). Debate V2 SQL is **`0006_debate_v2.sql`**.

## Component sheet vs spec

- Component sheet shows soft timer chips **30s / 60s / 90s / 120s**. Final rules specify **No limit, 3, 5, 10 minutes** only. Implementation follows the written rules.
- Component sheet verdict subtext ("Evidence and logic supports…") differs from frame 3 "Who made the stronger case?" — frames win for group verdict UI.
- MVP badge on frame shows "+50 PTS"; scoring spec uses **+2 MVP** — spec wins.

## Topics seed file

- `reference/wayfare-debate-topics/topics.json` **not found**. Keeping the existing 12 topics from `0002_debate.sql`; no invented topics.

## Judge hand-over toast

- Server promotes judge after 20s disconnect via `debate_touch_session` / join reload. Exact toast copy not in frames — using: "The judge role was reassigned."

## Restore archived groups

- Still no in-app restore UI (`restore_group` RPC exists from 0004).
