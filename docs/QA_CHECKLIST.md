# QA checklist

## Debate V2 — 12-player script

1. Create group; leader starts debate (no topic id on create).
2. Leader draws topic, **USE THIS TOPIC**; 11 others join by room code (max 12 in lobby before start).
3. Split **6 v 6**: each picks **AGREE** or **DISAGREE**; leader does not pick a side.
4. Repeat once with **11 v 1**; **START DEBATE** must fail until second player joins disagree side.
5. Debate: elapsed chip advances; optional soft timer shows nudge only.
6. Leader **READY FOR VERDICT** → **ANNOUNCE WINNER** with MVP; players see waiting copy.
7. Results: XP once (check profiles); replay blocked from double `publish_verdict`.
8. Judge disconnect >20s: another member becomes judge; toast on clients.
9. Late joiner during **debating** is **spectator** (read-only).
10. Rejoin within 10 minutes: same user refreshes roster via code.
11. Verdict change: within 30s window (RPC `change_verdict`) before finalize if testing manually.
12. Points: winners +3/+1, draw +2 side bonus, judge +1, MVP +2 (server `finalize_debate`).
