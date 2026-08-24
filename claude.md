# Project instructions

Expo template for responsive multi-platform apps (phone/tablet, iOS/Android). Derived from the Obytes React Native starter v9.0.0, then trimmed to our own conventions.

## Stack

- **Expo SDK 54** / React Native 0.81.5 / React 19.1 — custom dev client, Expo Go is not supported
- **Expo Router 6** — file-based routing, typed routes enabled
- **Uniwind + Tailwind CSS 4** — `className` on RN components; theme lives in `src/global.css` under `@theme`. This project does **not** use NativeWind
- **TanStack Query 5** + `react-query-kit` + axios — server state
- **Zustand 5** — client state
- **TanStack Form + Zod 4** — forms and validation
- **react-native-mmkv 4** — local storage
- **i18next** — `en` and `pt-BR`
- **Jest + React Testing Library** — unit tests; **Maestro** — E2E
- **ESLint** (`@antfu/eslint-config`) — lints *and* formats via ESLint Stylistic. There is no Prettier
- **pnpm** — enforced by `only-allow`

## Structure

```
src/
├─ app/            # Expo Router routes — one-line re-exports, no logic
├─ features/       # auth, home, settings, style-guide
├─ components/ui/  # design system
├─ lib/            # api, auth, i18n, storage, hooks, utils, test-utils
└─ translations/   # en.json, pt-br.json
```

A feature folder contains: `<name>-screen.tsx`, optional `components/`, optional `api.ts`, optional `use-<name>-store.tsx`, and tests beside the files they cover.

## Rules

- **Dependency direction** is `app/ → features/ → components/ui/ → lib/`. Never import leftwards. A feature never imports another feature — shared code moves up into `lib/` or `components/ui/`.
- **No barrel exports inside features** (`index.ts` re-exports break Fast Refresh). Import the file directly: `@/features/auth/login-screen`.
- **Imports**: absolute `@/…` across folders, relative `./…` within the same feature.
- **Routes are re-exports**: `export { HomeScreen as default } from '@/features/home/home-screen';` — logic lives in the feature.
- **TDD**: write the failing test first, then the implementation. Tests sit next to the file under test (`login-form.tsx` / `login-form.test.tsx`).
- **Styling** is Tailwind classes via `className`. Add design tokens to `@theme` in `src/global.css`, never as inline hex.
- **User-facing strings** go through `translate('key')` and must exist in every file under `src/translations/`.
- **Never edit `ios/` or `android/`** — they are generated. Use Expo config plugins in `app.config.ts`.
- **Git**: branch from `main` (`feat/…`, `fix/…`, `chore/…`, `docs/…`, `refactor/…`, `test/…`, `ci/…`). Conventional Commits, enforced by commitlint.

## Commands

```bash
pnpm start / ios / android    # run
pnpm lint / type-check / test # individual gates
pnpm check-all                # all gates + translation lint
pnpm e2e-test                 # maestro
```

## Known rough edges

- Running Jest on a single file can hang after the tests pass (open handles from MMKV/i18n). Pass `--forceExit` for single-file runs; the full `pnpm test` run exits on its own.
- `app.config.ts` ships with empty `EXPO_ACCOUNT_OWNER` and `EAS_PROJECT_ID` on purpose — EAS workflows stay inert until a real app fills them in.
