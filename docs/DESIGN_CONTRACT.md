# Debate V2 design contract

**Source boards:** `reference/debate-v2/` (read-only). Sliced frames: `docs/design-frames/debate-v2/{ID}.png`.  
**Spec:** `docs/content/DEBATE_SPEC.md` overrides frame copy where listed in DECISIONS below.  
**Logic spec path note:** Prompt references `reference/design-v2/debate-v2/`; repo ships `reference/debate-v2/` (same boards).

## Global tokens (sampled from boards)

| Token | Value | Usage |
| --- | --- | --- |
| Screen background | `#10121C` (`palette.midnightDeep`) | All debate + AUTH_LOOK dark account screens |
| Raised card | `#1A1F2E` (`palette.midnightRaised`) | Topic, side panels, inputs |
| Card border | `#2E3348` | Panels, outline buttons |
| Primary action | `#FFB800` / edge `#E5A500` | Gold CTAs, timer chip |
| Body text | `#FFFFFF` | Headlines |
| Muted text | `#9CA3AF` | Hints, waiting copy |
| **AGREE** | `#FF6B6B` (`palette.coral`) | All agree labels, borders, chips |
| **DISAGREE** | `#4ECDC4` (`palette.teal`) | All disagree labels, borders, chips |
| Error / offline banner | `#FF5C5C` on `#2A1218` | D10, A1 inline notice |
| Header title | 12px semibold, letter-spacing ~2px, ALL CAPS | DEBATE MODE, CHOOSE SIDES |
| Topic body | 18–20px regular, centered on D1 | Dynamic topic text |
| Card radius | 16px (`radii.lg`) | Topic card, side panels |
| Pill radius | 999 (`radii.pill`) | Timer chip, count pills |
| Min tap target | 44px | Buttons, header icons |
| Icons | Lucide vector set | No emoji; replace bolt/flame/medal in A3/O3 with Lucide |

## DECISIONS (override frames)

1. AGREE = coral, DISAGREE = teal everywhere (recolor S3/O1/O3 frames that show inverted colors).
2. Judge never on a side; excluded from side lists and player counts on S1/S3/D3/D4.
3. D6 MVP label: **+2 PTS** (not +50 PTS).
4. No Finalize Verdict sheet; **ANNOUNCE WINNER** publishes immediately. D8 **Change verdict** link: leader only, 30s after announce.
5. Component sheet C07: style reference only — do not ship Post Argument, Next in queue, Round x of y, Karma, Clarity, locked side panel, side panel point badges, or 30/60/90/120s timer sheet.
6. A1–A3: no Apple button; no Face ID/biometric toggle. Google behind existing flag.
7. A1 frame omits password + age checkbox; **keep both** from original sign-up flow, styled for AUTH_LOOK.
8. AUTH_LOOK = **dark** for all account routes (welcome, sign-in, sign-up, reset, profile-setup).
9. D5 pause: judge-only; freezes elapsed for all via server RPC. Gear opens soft timer: **3 MIN**, **5 MIN**, **10 MIN**, **No limit** (default).

---

## Board 01 — Group topic & picking

### D1 — Topic reveal (leader)

| Element | Content |
| --- | --- |
| Header | Back chevron (left), **DEBATE MODE** (center) |
| Category | **CATEGORY: FAITH & TECH** (dynamic) |
| Topic card | *Is social media doing more harm than good for youth ministries?* |
| Quote | *Be sharp, be kind. The best arguments are built on grace and logic.* |
| Primary CTA | **USE THIS TOPIC** |
| Secondary CTA | **SHUFFLE TOPIC** (refresh icon) |

Colors: category gold; topic white on raised card; CTAs gold primary + outline secondary.

### D2 — Topic reveal (waiting)

Same topic block as D1 without CTAs. Footer: three gold dots + **LEADER IS CHOOSING A TOPIC...** Header: info (i) icon right.

### D3 — Choose sides (judge)

| Element | Content |
| --- | --- |
| Header | **CHOOSE SIDES** |
| Topic | Compact topic card (same question) |
| Panels | **AGREE** (coral) / **DISAGREE** (teal); count badge; avatars; **+** control for judge `move_player` |
| Judge row | Avatar, **David K. (You)**, **THE JUDGE** (gold), gold border |
| Section | **CHOOSING** + avatars of debaters without a side yet |
| Footer | *Waiting for at least 1 player on each side* |
| CTA | **START DEBATE** (disabled until valid) |

### D4 — Choose your side (player)

| Element | Content |
| --- | --- |
| Header | **CHOOSE YOUR SIDE** |
| Panels | Tap **AGREE** / **DISAGREE**; **SELECTED** on chosen side; live counts + avatars |
| Judge row | **David K.**, **THE JUDGE**, **Host** badge |
| Waiting | **WAITING FOR OTHERS...** + avatars |
| Footer | **WAITING FOR LEADER TO START** |

---

## Board 02 — Debate & verdict

### D5 — Debating (leader)

| Element | Content |
| --- | --- |
| Top | Pause (left), elapsed pill **12:40** (gold), gear (right) |
| Topic | **CURRENT TOPIC** + question |
| Teams | **AGREE** / **DISAGREE** columns, avatars, **SPEAKING** badge optional |
| CTA | **READY FOR VERDICT** |
| Sheet | **Add soft timer** / *Optional alarm* — **3 MIN**, **5 MIN**, **10 MIN** |

**Player variant (missing frame):** D5 without pause, gear, or Ready CTA — see QUESTIONS.md.

### D6 — Final judgment (judge)

| Element | Content |
| --- | --- |
| Header | Close **X**, **FINAL JUDGMENT** |
| Question | **Who made the stronger case?** |
| Cards | **AGREE** (coral) / **DISAGREE** (teal) |
| Draw | **IT'S A DRAW** |
| MVP | **SELECT MVP (OPTIONAL)** **+2 PTS** |
| CTA | **ANNOUNCE WINNER** |

### D7 — Debate concluded (player)

**DEBATE CONCLUDED** · topic chip · **The leader is deciding...** · *Great arguments everyone! Let's see who took the crown this round.* · **JUDGE** David K.

---

## Board 03 — Results & setup edge

### D8 — Results (leader)

**RESULTS** · trophy card **AGREE WINS** / **THE STRONGER ARGUMENT** · **MATCH MVP** · **+3 MATCH POINTS** · **+2 MVP BONUS** · **ANOTHER TOPIC** · **BACK TO GROUP** · link **Change verdict** (30s).

### D9 — Your results (player)

**YOUR RESULTS** · **VICTORY ACHIEVED** · **+3 VICTORY** · **+1 TAKING PART** · **+2 MVP** · same CTAs as D8 (no Change verdict).

### D10 — Debate setup / edge

Banner **YOU ARE OFFLINE** · **Debate Setup** · **TEAMS** **Incomplete** · error *Each side needs at least 1 player to start the debate.* · **PARTICIPANTS** · online/reconnecting chips · **Add more players** · disabled **START DEBATE**.

---

## Board 04 — Same phone

### S1 — Players and judge

**Players** · **WHO IS PLAYING TODAY?** · player rows + **JUDGE** radio · **+ ADD PLAYER** · **CONTINUE**.

### S2 — Pass the phone

Avatar + hand badge · **Pass the phone to Ama** · *It's time to pick a side. Hand the device over to Ama Grace to continue.* · **I'M AMA**.

### S3 — Ready?

**Ready?** · **N PLAYERS** (debater count + judge, judge not listed on sides) · **CURRENT TOPIC** · **AGREE** (coral) / **DISAGREE** (teal) rosters · **START DEBATE**.

Side pick after S2: reuse **D4** panels (single player). Verdict/results: **D6** / **D8**.

---

## Board 05 — Solo

### O1 — Topic and stance

**SOLO MODE** · **DAILY CHALLENGE** · topic · **SHUFFLE TOPIC** · **PICK YOUR STANCE** · **AGREE** (coral) / **DISAGREE** (teal) · **SURPRISE ME** · **START SOLO DEBATE**.

### O2 — Make your case

**STANCE: AGREE** (coral/teal) · timer pill · **Make Your Case** · quoted topic · **YOUR 3 MAIN POINTS** · **RECORD VOICE NOTE** · **I'VE MADE MY CASE**.

### O3 — The Verdict

Gavel icon · **The Verdict** · *Which side convinced you more?* · AGREE/DISAGREE pills · **STILL UNSURE** · points + streak tiles (Lucide icons) · **ANOTHER TOPIC** · **BACK TO DASHBOARD**.

---

## Board 06 — Account (AUTH_LOOK dark)

### A1 — Create account

Icon · **Create Account** · *Join the world's sharpest debating community.* · **EMAIL ADDRESS** · notice *You already have an account. **Log in instead*** · **FULL NAME** · **PASSWORD** (kept, not in frame) · age checkbox (kept) · **CONTINUE** · **OR CONTINUE WITH** · Google (flagged).

### A2 — Welcome back

Avatar + check · **Welcome back, Kofi!** · email · **NOT YOU?** · **YOUR PASSWORD** · **FORGOT PASSWORD?** · **LOG IN**.

### A3 — Merge progress sheet

**Keep your XP and badges?** · XP + badge counts (Lucide) · *We found guest progress on this device...* · **KEEP MY PROGRESS** · **START FRESH**.

---

## Board 07 — Component sheet (C07)

Reference only. Do not implement listed excluded widgets (see DECISION #5).

---

## Screen → state map

| Frame | State / route |
| --- | --- |
| D1 | Online `topic`, judge |
| D2 | Online `topic`, non-judge |
| D3 | Online `picking`, judge + `move_player` |
| D4 | Online `picking`, debater `choose_side` |
| D5 | Online `debating`, judge (+ pause, soft timer) |
| D5 player | Online `debating`, debater/spectator |
| D6 | Online/local `verdict`, judge |
| D7 | Online `verdict`, non-judge |
| D8 | Online `results`, judge + change window |
| D9 | Online `results`, player/spectator |
| D10 | Setup error / offline / reconnecting |
| S1 | Pass setup |
| S2 | Pass handoff |
| D4 | Pass private side pick |
| S3 | Pass ready summary |
| O1–O3 | Solo pick / prep / verdict |
| A1–A3 | Auth sign-up / sign-in / merge sheet |
