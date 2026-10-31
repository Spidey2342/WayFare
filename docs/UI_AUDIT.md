# Wayfare UI audit (Step 1)

Audit date: 2026-10-31. Captures: Playwright Chromium, viewport **390×844**, **DPR 2**, served from `dist/` after `npx expo export --platform web`. Screenshots live in [`docs/audit/`](audit/). Design PNGs are the five frames in the project assets folder (Style Guide, Onboarding, Home & Decks, Gameplay, Final Screens).

Legend: **Mismatch** = differs from design. **OK** = aligned or intentionally dark surface per Style Guide.

## Global / theme

| Area | Design | App (audit) | Status |
| --- | --- | --- | --- |
| Default appearance | Light off-white `#F8F9FA` everywhere except listed dark surfaces | `themePreference` defaults to **system**; `ThemeProvider` uses `useColorScheme()` → entire app goes dark when OS/browser is dark (`home.png`, `home-system-dark-emulation.png`) | **Mismatch** |
| App background token | `#F8F9FA` | `palette.canvas` `#F4F5F8` on light; dark mode uses `#10121C` page fill | **Mismatch** (light gray + wrong mode) |
| `+html.tsx` body | Off-white shell | `background: #F4F5F8` | **Mismatch** |
| Status bar | Light content on light screens | `StatusBar style="auto"` follows system | **Mismatch** on light screens in dark OS |
| Typography loading | Poppins + Inter | Fonts load via `expo-font`; audit captures show consistent sans (no obvious fallback) | **OK** (verify weight scale in Step 4) |
| Bottom nav | Midnight pill, gold active, gold PLAY | Matches structure in light captures (`explore-decks.png`) | **OK** (spacing polish in Step 4) |
| Emoji in UI | Vector icons only (except Home 👋 and Share sample caption) | Profile badges render emoji from `badges.json`; `BadgeTile` uses emoji strings; `DiceCube` uses `✶`; dev kit uses emoji | **Mismatch** |
| Avatars | Photo rings in designs | Initial letter on solid color (`Avatar.tsx`) | **Mismatch** |
| Sparkles / generic decoration | Line icons per kit | `Sparkles` on testimony cards, wisdom deck, `CardFace` | **Mismatch** (not in Card Library art) |

## Style Guide & UI Kit (`/dev/kit`)

Screenshot: [`style-guide-dev-kit.png`](audit/style-guide-dev-kit.png)

| Area | Design | App | Status |
| --- | --- | --- | --- |
| Page background | Off-white component sheet | Follows theme (dark when system dark) | **Mismatch** |
| Button samples | Primary midnight + gold main action | Components exist; gold label casing differs (`Get started` vs `GET STARTED`) | **Mismatch** |
| Card library | Five typed cards with corner badge | `CardFace` present; testimony uses Sparkles not kit glyph | **Mismatch** |
| Badge tiles | Icon badges, not emoji | Dev kit shows emoji badge samples | **Mismatch** |

## Onboarding

### Welcome (`/welcome`)

Screenshot: [`onboarding-welcome.png`](audit/onboarding-welcome.png)

| Area | Design | App | Status |
| --- | --- | --- | --- |
| Background | Midnight gradient | Flat midnight (`Screen background={midnight}`) | **Mismatch** (no gradient) |
| Logo / wordmark | Compass tile, WAYFARE, gold rule | `Logo` component | **OK** |
| Tagline | Two lines; gold italic second line | Present | **OK** |
| CTA | Gold `GET STARTED` | Gold button, sentence case `Get started` | **Mismatch** |
| Step indicator | Gold bar + dots | Gold pill + dots | **OK** |

### Grow as you go (`/how-it-works`)

Screenshot: [`onboarding-how-it-works.png`](audit/onboarding-how-it-works.png)

| Area | Design | App | Status |
| --- | --- | --- | --- |
| Background | Off-white | Light surface when OS light | **OK** |
| Header | Progress bar + SKIP | Dots + SKIP | **Mismatch** (indicator style) |
| Steps | Numbered rows + colored icon tiles | Three steps with Lucide icons | **Partial** (copy differs from design) |
| Hero illustration | Walker + suitcase in navy circle | Large navy circle with **Users** icon only | **Mismatch** |
| CTA | Navy `NEXT →` | Navy `Next` without arrow | **Mismatch** |

### Start your adventure (`/choose-mode`)

Screenshot: [`onboarding-choose-mode.png`](audit/onboarding-choose-mode.png)

| Area | Design | App | Status |
| --- | --- | --- | --- |
| Background | Off-white | Light when OS light | **OK** |
| Pass / Team cards | White vs selected midnight; team tags | Cards present | **Partial** (team pills, avatar stack density) |
| Footer verse | Col 4:6 paraphrase | Present in copy | **Verify** in Step 4 |
| CTA | Gold `CONTINUE` | Gold continue button | **Partial** (casing) |

## Home & decks

### Home (`/home`)

Screenshots: [`home.png`](audit/home.png) (system dark), [`home-system-dark-emulation.png`](audit/home-system-dark-emulation.png)

| Area | Design | App | Status |
| --- | --- | --- | --- |
| Page background | Off-white | **Dark** when theme follows system dark | **Mismatch** |
| Greeting | Time + “Hello, Kofi! 👋” | “Good morning” + “Hello, Kofi!” **no wave** | **Mismatch** |
| Avatar | Photo + gold ring + status dot | Letter “K” on gold fill | **Mismatch** |
| Continue Journey | Midnight card, streak chip, icon path, **RESUME PLAYING** | Midnight card OK; chip “Start here”; numeric path; **Start playing** | **Mismatch** |
| Quick Decks | Purple / coral / teal tiles + SEE ALL | Two decks; Heart for Courage (design: shield); no SEE ALL | **Mismatch** |
| Verse of the day | Large quote mark, share circle button | `QuoteCard` minimal; share icon only | **Mismatch** |
| Community teaser | Teaser card on home | Present | **Partial** |

### Explore decks (`/decks`)

Screenshot: [`explore-decks.png`](audit/explore-decks.png)

| Area | Design | App | Status |
| --- | --- | --- | --- |
| Background | Off-white | Off-white in light capture | **OK** |
| Tabs | All Decks / Challenges / Favorites | Segmented control | **OK** |
| Grid | 2-col tiles, ratings/lock chips | Tiles; missing star ratings on unlocked | **Mismatch** |
| Outing PRO banner | Full-width gold bus banner | `ProDeckBanner` | **Verify** spacing in Step 4 |
| Icons | Brain / shield / serving motifs | Lucide book, heart, hand-heart | **Partial** |

### Deck detail — Identity (`/deck/identity`)

Screenshot: [`deck-detail-identity.png`](audit/deck-detail-identity.png)

| Area | Design | App | Status |
| --- | --- | --- | --- |
| Hero | Full-bleed purple glass cover sheet | `DeckCover tall` in scroll, not overlapping sheet | **Mismatch** |
| Body sheet | White sheet over hero with overlap | Flat scroll on same background | **Mismatch** |
| Stats | Clock + card stack icons | Text only “20-30 mins · 24 cards” | **Mismatch** |
| Breakdown | 2×2 colored type tiles (15/15/10/10 design) | Five neutral count tiles | **Mismatch** |
| CTA | Fixed bottom `START JOURNEY >` | Inline gold `Start journey` | **Mismatch** |

## Gameplay

### Setup (`/setup`)

Screenshot: [`setup-game.png`](audit/setup-game.png)

| Area | Design | App | Status |
| --- | --- | --- | --- |
| Background | Off-white | Light in capture | **OK** |
| Title | `SETUP GAME` caption | “Setup game” title case | **Mismatch** |
| Mode chips | Large tiles with icons | Text-only mode buttons | **Mismatch** |
| Players | Accent bar + color dots | `PlayerRow` | **Partial** |
| Slider | 5–25 min labels | `RoundSlider` | **OK** |
| CTA | Gold start | Gold start | **Partial** (label casing) |

### Active game (`/game/[sessionId]`)

Screenshot: [`gameplay-active.png`](audit/gameplay-active.png)

| Area | Design | App | Status |
| --- | --- | --- | --- |
| Background | Midnight | Midnight | **OK** |
| Turn / score | Pill chip + large gold score | Plain text columns | **Mismatch** |
| Card | Gold word card with glow; type pill | Testimony purple in capture; no glow; Sparkles badge | **Mismatch** |
| Timer | Coral/gold ring 45s | Empty ring in capture | **Mismatch** |
| Actions | `SKIP CARD` ghost + gold `DONE` | Secondary `Skip once` + gold `Done` | **Mismatch** |

### Dice (`/game/dice`)

Screenshot: [`dice.png`](audit/dice.png)

| Area | Design | App | Status |
| --- | --- | --- | --- |
| Background | Off-white | Light in capture | **OK** |
| Cube | Large midnight cube, decorative stars | `DiceCube` with dot faces | **Mismatch** |
| Result | Coral RESULT chip + huge word | Chip + result text | **Partial** |

### Leaderboard (`/game/leaderboard`)

Screenshot: [`leaderboard.png`](audit/leaderboard.png)

| Area | Design | App | Status |
| --- | --- | --- | --- |
| Background | Off-white | Light | **OK** |
| Header | Trophy + ROUND X OF Y | Text only | **Mismatch** |
| Rows | Crown, progress bar, HOT STREAK chips | Simpler rows | **Mismatch** |
| Footer CTA | Design shows `START GAME` on some frames | `Finish session` | **Mismatch** (flow copy) |

## Final screens

### Session complete (`/game/complete`)

Screenshot: [`session-complete.png`](audit/session-complete.png)

| Area | Design | App | Status |
| --- | --- | --- | --- |
| Background | Off-white | Light | **OK** |
| Hero | Gold hands icon + “AMAZING SESSION!” | Text only, sentence case | **Mismatch** |
| Stats | Points + deck completed % | Cards played + unity | **Partial** |
| Closing prayer | **Dark** prayer card | White card | **Mismatch** |
| Scripture card | Purple “Scripture of the day” block | Missing | **Mismatch** |
| CTAs | Gold share + white back | Present | **Partial** (icons, casing) |

### Share the moment (`/share`)

Screenshot: [`share-moment.png`](audit/share-moment.png)

| Area | Design | App | Status |
| --- | --- | --- | --- |
| Background | Dark | Midnight | **OK** |
| Photo frame | Group photo + caption overlay sample | Placeholder “Your photo”; generic caption | **Mismatch** |
| Actions | POST TO COMMUNITY blue button | “Post to journey” gold | **Mismatch** |

### Journey (`/journey`)

Screenshot: [`journey.png`](audit/journey.png)

| Area | Design | App | Status |
| --- | --- | --- | --- |
| Background | Off-white | Light | **OK** |
| Path | **Vertical dashed** winding path + nodes | Horizontal wrap of square nodes | **Mismatch** |
| Streak | Flame chip “12 DAY STREAK” in header | Text only in body | **Mismatch** |
| Badges row | Recent badges horizontal scroll | Text only | **Mismatch** |

### Profile (`/profile`)

Screenshot: [`profile.png`](audit/profile.png)

| Area | Design | App | Status |
| --- | --- | --- | --- |
| Header block | Dark rounded bottom, photo, rank | Dark hero, letter avatar | **Partial** |
| Body | White badges + settings on off-white | Light body | **OK** |
| Stats | XP / decks / streak labels | Cards played / streak / service | **Partial** |
| Badges | Icon grid | **24 emoji** tiles | **Mismatch** |
| Settings | Notifications toggle row | Text rows | **Partial** |

## Community (`/community`)

Screenshot: [`community.png`](audit/community.png)

| Area | Design | App | Status |
| --- | --- | --- | --- |
| Background | Light feed | Light | **OK** |
| Reactions | Icon reaction bar | Text-only `ReactionBar` | **Mismatch** |
| Posts | Example label | “Example” time label | **OK** |

## Other routes (no dedicated design frame)

| Route | Screenshot | Notes |
| --- | --- | --- |
| `/outing` | (not captured) | Placeholder; verify in Step 4 |
| `/+not-found` | (not captured) | Branded 404; verify in Step 4 |

## Emoji inventory (UI-facing)

| Location | Finding |
| --- | --- |
| `src/data/badges.json` | All 24 badge `icon` fields are emoji (data drives Profile UI) |
| `src/components/ui/BadgeTile.tsx` | Renders `icon` as `Text` emoji |
| `app/(tabs)/profile.tsx` | Maps badges → emoji tiles |
| `app/dev/kit.tsx` | Sample emoji badges |
| `src/components/ui/DiceCube.tsx` | `✶` on face |
| `src/components/ui/CardFace.tsx` | Sparkles icon (Lucide), not emoji but off-kit |

Allowed later (design): Home greeting 👋; Share sample caption with 🙌 (when photo mock added).

## Step 1 exit criteria

- [x] Side-by-side review performed (design PNGs vs Playwright captures)
- [x] Screenshots saved under `docs/audit/`
- [x] Mismatch list recorded above
- [ ] Fixes deferred to Steps 2–5

## Before/after tracking

After Steps 2–5, update each row to **Matches design** or document residual gap in the “Status” column and in [`docs/audit/compare/`](audit/compare/) (Step 5).
