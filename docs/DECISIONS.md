# Decisions

## Web output is a single-page app

Expo SDK 58 can export `static` HTML per route or a `single` page app. Game sessions use ids created at runtime. A static export only pre-renders routes known at build time, so a refresh on `/game/<id>` would 404. `web.output` is `single`, and Vercel rewrites unknown paths to `index.html`. The production command is still `npx expo export --platform web`.

## Storage

`KeyValueStorage` is the persistence port. Native uses AsyncStorage. Web uses `localStorage`. `createSafeStorage` catches thrown reads and writes and keeps an in-memory copy for the rest of the session, including private browsing that blocks storage.

## Guest name

A fresh profile is named Kofi so the home greeting matches the design. The name is editable. Guests can use solo and same-phone play offline without Supabase. Online groups and multiplayer require sign-in.

## Supabase and auth

The anon key and URL live in `.env` only (`EXPO_PUBLIC_*`). Client code never uses `service_role`. Profiles are created by a trigger on `auth.users`. Group membership changes go through SECURITY DEFINER RPCs, not direct inserts. Delete account uses `delete_my_account` then sign-out.

## Guided onboarding

After profile setup (account holders) or guest entry, users see goal selection, a skippable 3-step tour, and a required offline practice round that awards the First Step badge. Progress resumes via `tutorial_step` on the profile and local store v5 fields. Home shows a Start here checklist until complete or dismissed.

## Play modes

The center Play button opens a sheet: Solo, Same phone, With friends online. Online requires auth. First visit to each mode can show a short how-to sheet; Profile Help can replay the tour.

## Scripture

Card and verse text uses the King James Version, which is public domain. The UI says so. No copyrighted translations are bundled.

## Dev kit

`/dev/kit` stays available in production builds. It only renders design tokens and components. It is not linked from the main navigation.

## Rounds

Round count is `max(1, round(minutes / 5))`. Ten minutes is two rounds. A round ends when every player has taken one turn. The session ends when those rounds are finished. The minute choice is the planned length; the turn count is what actually closes the session.

## Progress

A finished session awards 10 XP plus 2 XP per card played. Lessons award 15 XP; quizzes award 10 XP. Levels come from `src/data/levels.json`. A streak increases only on a new local calendar day and resets when a day is missed. Applying the same session id twice does not add XP again. The weekly challenge resets when the local week key changes. Store schema version 3 adds `completedLessons`, `booksRead`, and `quizzesCompleted`. Default theme preference is `light`.

## Deck and Learn content

Authoritative JSON lives under `src/data/decks/` and `src/data/learn/`, copied from read-only `reference/`. Gameplay and deck screens load cards through `src/features/decks/repository.ts` with Zod validation.

### Shipped deck metadata repair

Some deck JSON files in reference have shifted fields (for example icon name in `difficulty`, minutes in `locked`). The app repairs rows in `src/features/decks/repairDeckRaw.ts` before Zod parse. Locked flags follow the deck README table. Do not edit `reference/`; fix upstream content separately if needed.

### Lesson mini-quiz categories

Lesson screens pick three quiz questions by mapping each study path to the closest quiz category (`identity` → `people`, `courage` → `old-testament`, `serving` → `new-testament`, `the-journey` → `jesus`). There is no per-lesson quiz id in the source files.

### Badges (24 total)

Learn badges use Lucide icon keys in `src/data/badges.json`. `scripture-seeker` triggers on the first completed lesson (`lessons:1`), not on the first word card in a game session.

## Offline

Learn and deck content is bundled via Metro imports, so it works offline without network. For web, `npm run sync:public-content` copies JSON into `public/data/` before export; `public/sw.js` precaches those URLs plus the app shell. Native builds rely on the bundled JS.

## Placeholders

- Community feed remains sample copy; no live API.
- Pro / Outing deck is navigational only until billing exists.
- Team quiz mode reuses solo UI; shared leaderboard wiring for Learn quiz is unchanged from the main game leaderboard pattern.
