# Decisions

## Web output is a single-page app

Expo SDK 58 can export `static` HTML per route or a `single` page app. Game sessions use ids created at runtime. A static export only pre-renders routes known at build time, so a refresh on `/game/<id>` would 404. `web.output` is `single`, and Vercel rewrites unknown paths to `index.html`. The production command is still `npx expo export --platform web`.

## Storage

`KeyValueStorage` is the persistence port. Native uses AsyncStorage. Web uses `localStorage`. `createSafeStorage` catches thrown reads and writes and keeps an in-memory copy for the rest of the session, including private browsing that blocks storage.

## Guest name

A fresh profile is named Kofi so the home greeting matches the design. The name is editable. There is no account in v1. Log out resets this local guest.

## Scripture

Card and verse text uses the King James Version, which is public domain. The UI says so. No copyrighted translations are bundled.

## Dev kit

`/dev/kit` stays available in production builds. It only renders design tokens and components. It is not linked from the main navigation.

## Rounds

Round count is `max(1, round(minutes / 5))`. Ten minutes is two rounds. A round ends when every player has taken one turn. The session ends when those rounds are finished. The minute choice is the planned length; the turn count is what actually closes the session.

## Progress

A finished session awards 10 XP plus 2 XP for each card played. Levels come from `src/data/levels.json`. A streak increases only on a new local calendar day and resets when a day is missed. The previous day is computed from the local year, month, and date, so a daylight-saving change does not skip or double a day. Applying the same session id twice does not add XP again. The weekly challenge resets when the local week key changes.

## Playable cards before the full library

Gameplay uses a small Identity card bank in `src/data/previewCards.ts` so the engine, scoring, dice, and resume-after-refresh can be verified. Deck screens still show the planned catalog counts. Stage 6 replaces this bank with validated JSON and real counts.
