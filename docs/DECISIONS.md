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
