# WAYFARE DEBATE — COMPLETE LOGIC SPEC (final; nothing here is optional)

## 0. SCOPE
Build Debate in three modes: SOLO, SAME PHONE, ONLINE GROUP. Nothing else. All other games stay untouched.
Frame IDs: D1-D10 (group), S1-S3 (same phone), O1-O3 (solo), A1-A3 (account), from reference/design-v2/debate-v2/.

## 1. DECISIONS (override anything that differs in the frames)
1. AGREE = coral, DISAGREE = teal on every screen.
2. The judge never holds a side and is excluded from side counts.
3. MVP bonus label shows "+2 PTS".
4. No "Finalize Verdict" confirm sheet. "Announce winner" announces directly. "Change verdict" is available for 30 seconds only.
5. Do NOT build: Post Argument, Next in queue, Round x of y UI, Karma, Clarity, locked side panel, points on side panels, 30/60/90/120s timer sheet.
6. No Apple sign-in, no Face ID toggle. Google button stays behind its existing flag.
7. Sign-up keeps the password field and the age checkbox.
8. Use vector icons, never emoji.
9. Sample topics, names, and numbers in frames are placeholders.
10. Points are XP. Solo XP cap: 5 solo debates per day count toward XP (more are allowed, they just give 0 XP).

## 2. ROLES AND LIMITS
- Online roles: JUDGE (the group leader who starts it), DEBATER, SPECTATOR.
- Max 20 participants (including the judge). Design and test for 12. Minimum to start debating: 1 debater on each side (so 3 people including the judge).
- A user can be in only ONE live online session. Joining again from another device takes over the seat.
- Room/lobby expiry: 4 hours after last activity.
- Same phone: 3 to 8 players, one of them is the judge.

## 3. ONLINE STATE MACHINE (server-authoritative)
Phases: LOBBY, TOPIC, PICKING, DEBATING, VERDICT, RESULTS, FINISHED. `round_no` starts at 1.

| Phase | Who acts | Action (server function) | Preconditions | Next phase |
|---|---|---|---|---|
| LOBBY | Judge (group leader) | create_debate_session(group_id) from the group lobby "Start game" then pick Debate | caller is group leader; no other open session for the group | TOPIC |
| TOPIC | Judge | shuffle_topic | phase=TOPIC | TOPIC (new random topic, never one already used by this group until all are used, then reset history) |
| TOPIC | Judge | use_topic | topic drawn | PICKING |
| PICKING | Each debater | choose_side(agree/disagree) | phase=PICKING; caller is not the judge | PICKING (can switch any time) |
| PICKING | Judge | move_player(user, side) | phase=PICKING | PICKING |
| PICKING | Judge | start_debate | at least 1 debater on EACH side | DEBATING (sets debate_started_at) |
| DEBATING | Judge | pause_debate / resume_debate | phase=DEBATING | DEBATING |
| DEBATING | Judge | set_soft_timer(null,3,5,10) | phase=DEBATING | DEBATING |
| DEBATING | Judge | request_verdict | phase=DEBATING | VERDICT |
| VERDICT | Judge | cancel_verdict (the X in D6) | phase=VERDICT | DEBATING |
| VERDICT | Judge | submit_verdict(winning_side agree/disagree/draw, mvp_user_id optional) | MVP must be a current debater | RESULTS (verdict_announced_at set) |
| RESULTS | Judge | change_verdict(...) | now < verdict_announced_at + 30s | RESULTS (recomputed) |
| RESULTS | Judge | next_round | phase=RESULTS | TOPIC (round_no+1, sides cleared, finalize previous round first) |
| RESULTS | Judge | end_session | phase=RESULTS | FINISHED (finalize first) |
| ANY | Anyone | leave_session | caller in session | stays (caller removed) |
| ANY | Any participant | claim_judge | judge's last heartbeat older than 20s | same phase, new judge |
| ANY | Judge | set_judge(user) | caller is judge | same phase |

Rules:
- Every function: validate auth.uid(), role, and phase INSIDE the database, lock the session row (SELECT ... FOR UPDATE), be idempotent, and increment `state_version`.
- If the client passes `expected_phase` and it does not match, return error `wrong_phase` so the client refetches.
- `get_session_state(session_id)` returns one snapshot: session, topic, round_no, phase, judge, participants (role, side, presence), soft timer, pause info, verdict, results, server_now. Clients render ONLY this snapshot (via Realtime updates on the session, participants, and verdict rows, then refetch).
- Late joiners: PICKING joins as DEBATER (no side yet); DEBATING, VERDICT, RESULTS join as SPECTATOR.
- A side with 0 debaters during DEBATING is allowed (judge sees a banner); verdict can still be submitted.
- When all participants have left for 60 seconds the session becomes FINISHED.

## 4. POINTS (computed on the server only)
- Winning side: +3 to every debater on that side who is still in the session.
- Draw: +2 to every debater.
- MVP: +2 extra (must be a debater).
- Taking part: +1 to every debater, and +1 to the judge.
- Spectators: 0.
- XP is awarded exactly once per round: at `finalize_round`, which runs when the 30-second change window has ended, or when the judge taps Another topic / Back to group / End session, whichever comes first. If the verdict changes inside the window, points are recomputed before awarding. `xp_awarded_at` makes it idempotent.
- Results screens show the computed points immediately (D8, D9).

## 5. CLOCKS (online)
- Elapsed = server_now - debate_started_at - total_paused_time. Client gets `server_now` once, stores the offset, and renders from it. All phones agree within about 1 second.
- Pause stores paused_at; resume adds the pause length to total_paused_time. Judge only.
- Soft timer (minutes or null): when elapsed reaches it, every client shows a gentle nudge once ("Time's up. Keep going or wrap up?"). It NEVER changes the phase or blocks anything. The judge can pick another soft timer value to extend.
- Pause the local ticker when the tab is hidden; resync on return.

## 6. PRESENCE AND HAND-OVER
- Each client sends a heartbeat (touch_session) every 5 seconds and uses Realtime Presence for the Online / Reconnecting / Away chips.
- If the judge is unreachable for 20 seconds, any participant may call claim_judge; the server promotes another group leader if one is present, else the longest-connected member. Everyone sees a toast: "<name> is now the judge." The old judge returning becomes a spectator (the new judge may use set_judge to give it back).
- A dropped player has 10 minutes to rejoin and keeps their side. They are excluded from points if they never return before finalize.

## 7. SOLO STATE MACHINE (local, works offline for guests)
1. O1: random topic (Shuffle unlimited), pick AGREE or DISAGREE or "Surprise me" (random).
2. O2: "Make Your Case": up to 3 point inputs, elapsed timer (no limit), optional voice note (never required, graceful if permission denied).
3. Switch: show O2 again with the stance flipped to the opposite side (no interstitial; no frame exists).
4. O3: "Which side convinced you more?" AGREE / DISAGREE / "Still unsure". Shows +1 XP and the streak, buttons "Another topic" and "Back to dashboard".
- XP: +1 per solo debate, up to 5 per day. Streak updates once per day.
- Signed-in users: award through a server function `award_solo_debate()` (enforces the daily cap server-side); if offline, queue and send later. Guests: local only.

## 8. SAME-PHONE STATE MACHINE (local, works offline for guests)
1. S1: add 3 to 8 players, choose exactly one judge (radio).
2. Topic: use the D1 layout for the judge (Shuffle, Use this topic).
3. Side picking, for each non-judge player in order: S2 "Pass the phone to <name>" then they tap "I'm <name>" then see AGREE / DISAGREE panels (reuse D4) then choose, then the screen hides the choice.
4. S3: summary ("Ready?") with counts and lists. "Start debate" is disabled until both sides have at least 1 player; if not, show the D10 error text and let the judge send the phone back to a player to change side.
5. Debating: D5 (the judge holds the phone): elapsed clock, pause, soft timer, Ready for verdict.
6. Verdict: D6. Results: D8 with per-player points computed by the same scoring rules.
7. "Pass the judge role": a simple list sheet to choose another player. The judge never holds a side.
- XP goes only to the person signed in on this phone, using the points of the first player in the list (marked "(You)"); guests store it locally.
- Leaving mid-game asks for confirmation (Stay / Leave). Leaving abandons the game with no XP.

## 9. DATABASE (new migration; if 0005 is unapplied edit it, otherwise add 0006)
- game_sessions: round_no, state_version, judge_id, phase (lobby, topic, picking, debating, verdict, results, finished), topic_id, soft_timer_minutes, debate_started_at, paused_at, total_paused_seconds, verdict_announced_at, last_activity_at, expires_at, max_players=20.
- session_players: role (judge/debater/spectator), side (agree/disagree/null), last_seen_at, joined_at, left_at.
- debate_verdicts: unique (session_id, round_no); winning_side, mvp_user_id, decided_by, decided_at, changed_at, xp_awarded_at, points jsonb.
- group_topic_history (group_id, topic_id, used_at).
- All tables RLS-on. Participants can read their session data. Only the listed functions can write.

## 10. ERRORS (server codes and user-facing text)
not_authenticated: "Please sign in to play with friends." | not_member: "You're not in this group." | not_judge: "Only the leader can do that." | wrong_phase: "That moved on. Refreshing..." | side_required: "Each side needs at least 1 player to start the debate." | session_full: "This room is full." | already_in_session: "You're already in a debate. Rejoin it?" | session_expired: "This debate has ended." | rate_limited: "Slow down for a moment." | offline: "You are offline."
Show errors with the existing inline-notice or toast style. Never silent failures.

## 11. EDGE CASES (each must behave as written)
1. Double-tap any action: it happens once (button disabled in flight; function idempotent).
2. Player switches side repeatedly: last choice wins; counts update live for everyone.
3. Player leaves during PICKING: removed from counts immediately.
4. A side becomes empty during DEBATING: banner for the judge, verdict still allowed.
5. App backgrounded or closed: on return, call get_session_state and resync; if FINISHED, go to results or home.
6. Offline during a session: actions disabled with the offline banner (D10 style); reconnect triggers a refetch. No offline queue for online sessions.
7. Topic pool exhausted: reset history, continue.
8. Judge changes verdict after 30s: server rejects with `wrong_phase`; button is already hidden.
9. Spectators see results screens (D9 style without personal points).
10. 12 players (6 v 6, 11 v 1): lists wrap, avatars stack with "+N" chips, nothing overflows.
11. Two devices, same user: the newest takes over; the old one shows "You joined from another device."
12. Back navigation during an online session opens the "Leave this game?" sheet (Stay / Leave).

## 12. SCREEN MAP
Online: TOPIC judge D1, players D2 | PICKING judge D3 (error state: D10), players D4 | DEBATING judge D5, players D5 without Ready/pause/gear (log in QUESTIONS.md) | VERDICT judge D6, players D7 | RESULTS judge D8, players D9, spectators D9 variant
Same phone: S1, topic D1, pick D4, pass S2, summary S3, debating D5, verdict D6, results D8
Solo: O1, O2 (twice, flipped), O3
Account: A1 duplicate email notice, A2 welcome back, A3 merge sheet

## 13. ACCEPTANCE TESTS (every one must PASS before any task is called done)
Unit (pure TypeScript in src/features/debate, mirrored by SQL):
 U1 scoring: win, draw, MVP, taking part, judge +1, spectators 0
 U2 start rule: blocked with an empty side, allowed with 1 v 1
 U3 judge never counted as a debater
 U4 verdict change window at 29s allowed, 31s rejected
 U5 topic history never repeats until the pool is exhausted, then resets
 U6 soft timer nudge fires once and never changes phase
 U7 solo XP cap at 5 per day
Online (database or scripted, against a test project):
 O-1 12 simulated users: judge + 6 agree + 5 disagree complete a full round and the points match section 4
 O-2 11 v 1 split works; 6 v 6 works
 O-3 judge disconnects 20s: claim_judge promotes a new judge and the game continues
 O-4 late joiner during PICKING becomes a debater; during DEBATING becomes a spectator
 O-5 rejoin within 10 minutes keeps side and phase
 O-6 two quick taps on Announce winner produce one verdict and one XP award
 O-7 non-judge calling a judge function returns not_judge
 O-8 next_round clears sides, increments round_no, and awards the previous round exactly once
 O-9 21st participant gets session_full
UI (Playwright, 390x844): every frame D1-D10, S1-S3, O1-O3, A1-A3 renders all its verbatim text, uses AGREE=coral/DISAGREE=teal, has no emoji, and has working back navigation; plus 12-player screenshots of D3, D4, D5.
Same phone / Solo (Playwright): full run offline with no network, end to end.
## 14. DATA STORAGE (Supabase is the source of truth; local is only a fast cache)

### 14.1 What lives where
| Data | Source of truth | Local copy |
|---|---|---|
| Profile, XP, streak, badges, debate stats | Supabase (`profiles`, `user_stats`, `user_badges`) | Cache for instant render only. Server wins on conflict. |
| Groups, members, join codes | Supabase | Cache only |
| Online debate sessions, verdicts, results | Supabase (via `get_session_state`) | Only the room code, to rejoin. Never game state. |
| Debate topics | Supabase (`debate_topics`) | Cache + bundled JSON as last-resort first-run fallback |
| Solo / Same-phone results (signed in) | Supabase (via RPC) | Outbox queue until delivered (see 14.4) |
| Guest progress | Local only | Merged on sign-up (`merge_guest_progress`) |

### 14.2 Tables and functions to add (new migration)
- `user_stats` (user_id pk, xp int, streak_days int, last_active_date date, solo_debates_today int, solo_day date, debates_judged int, debate_mvps int, updated_at). RLS: a user reads only their own row. No direct writes from the client.
- `user_badges` (user_id, badge_id, earned_at; pk user_id + badge_id). RLS: read own; no direct writes.
- RPCs (SECURITY DEFINER, validate `auth.uid()`): `get_my_stats()` returns stats + badges in one call; `award_solo_debate(client_id uuid)` (enforces the 5-per-day cap and the streak server-side, idempotent on `client_id`); `award_badge_if_earned(badge_id)` used internally by finalize_round for Silver Tongue (first MVP) and Fair Judge (judged 5 debates).
- `finalize_round` (section 4) must write XP, `debates_judged`, `debate_mvps`, and badges to these tables.
- `debate_topics`: has `updated_at`; a trigger bumps it on any change.

### 14.3 Fast loading (cache rules)
- Topics: on launch, render from the local cache immediately, then call `get_topics_since(last_sync timestamp)` and merge only changed rows (plus a list of unpublished ids to remove). The full list is about 20 KB, so a first download is quick, and later syncs usually transfer nothing.
- Stats and badges: render the cached copy first, then `get_my_stats()` in the background and update the screen when it returns.
- Every cache entry stores `synced_at`. Server data always overwrites the cache. Never write cache-only changes back to the server except through the outbox.
- Remove the local persistence (zustand persist) of server-owned fields (`xp`, `badges`, `streak`, debate stats) for signed-in users. Keep the persisted copy only as the cache described above. Guests keep local persistence.

### 14.4 Outbox (offline delivery, not a database)
- When a signed-in user finishes a Solo or Same-phone debate offline, store one outbox item with a client-generated `client_id`, then deliver it with the RPC when the connection returns (retry with backoff; the server ignores a repeated `client_id`).
- The UI shows the XP immediately as "pending" (small clock icon) and replaces it with the server value after delivery.

### 14.5 Acceptance tests (all must PASS)
 S-1 Sign in, earn XP in a Solo debate, clear all browser storage, reload, sign in again: the same XP, streak, and badges appear (from Supabase).
 S-2 Sign in on a second device: the same XP and badges appear.
 S-3 Change a topic's text in Supabase: the app shows the new text after a refresh, downloading only the changed row (log the request size).
 S-4 Open the app on a slow connection: topics and stats show instantly from cache and update when the network responds.
 S-5 Airplane mode: Solo works, XP shows as pending, and after reconnect it is delivered exactly once.
 S-6 A guest plays Solo, then signs up: the merge happens once and the data is in Supabase.
 S-7 Searching the code for `localStorage`/`AsyncStorage`/`persist(` shows only the storage adapter, the cache module, the outbox, and guest data. No server-owned data is written only locally.
 ## 15. ACCOUNTS ONLY (overrides every earlier mention of guests)
- Delete these from the spec's behavior: guest play, guest local-only XP, guest-to-account merge (section 8 and 14.1 guest rows, A3 sheet).
- Solo, Same phone, and Online ALL require a signed-in account. Solo and Same phone still work offline once the user is signed in, using the saved session. Their results go through the outbox (14.4) and are delivered when the connection returns.
- Outbox items and caches are keyed by user id.