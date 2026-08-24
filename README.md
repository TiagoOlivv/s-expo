# my-app-template

Opinionated Expo template for building responsive, multi-platform apps (phone and tablet, iOS and Android).

Derived from the [Obytes React Native starter](https://github.com/obytes/react-native-template-obytes) v9.0.0, then trimmed to a single reference feature and adapted to our own conventions.

## Stack

| Concern | Choice |
| --- | --- |
| Runtime | Expo SDK 54, React Native 0.81.5, React 19.1 |
| Routing | Expo Router 6 (file-based, typed routes) |
| Styling | Uniwind + Tailwind CSS 4 (`className`, theme via CSS `@theme`) |
| Server state | TanStack Query 5 + `react-query-kit` + axios |
| Client state | Zustand 5 |
| Forms | TanStack Form + Zod 4 |
| Storage | react-native-mmkv 4 |
| i18n | i18next + react-i18next (`en`, `pt-BR`) |
| Unit tests | Jest + React Testing Library |
| E2E | Maestro |
| Lint & format | ESLint (`@antfu/eslint-config`, formatting via ESLint Stylistic — no Prettier) |
| Package manager | pnpm |

## Getting started

```bash
pnpm install
pnpm start            # dev server
pnpm ios              # run on iOS simulator
pnpm android          # run on Android emulator
```

This template uses an Expo custom dev client, so Expo Go is not supported. Build and install the dev client first.

## Quality gates

```bash
pnpm lint             # eslint
pnpm type-check       # tsc --noemit
pnpm test             # jest
pnpm check-all        # all of the above + translation lint
pnpm e2e-test         # maestro flows (requires a running emulator)
```

Every change is written test-first. See `docs/` for the full conventions.

## Project structure

```
src/
├─ app/            # Expo Router routes — thin re-exports only
├─ features/       # one folder per domain: screen, components/, api.ts, store
├─ components/ui/  # design system
├─ lib/            # infrastructure: api client, auth, i18n, storage, hooks
└─ translations/   # locale JSON files
```

Dependency rule — imports only flow to the right:

```
app/  →  features/  →  components/ui/  →  lib/
```

A feature never imports another feature. Shared code moves up into `lib/` or `components/ui/`.

## Before shipping a real app

- `app.config.ts` — set `EXPO_ACCOUNT_OWNER` and `EAS_PROJECT_ID` (both are intentionally empty)
- `env.ts` — rename `NAME`, `BUNDLE_IDS`, `PACKAGES`, `SCHEMES`
- `.env` — point `EXPO_PUBLIC_API_URL` at a real API

## Git workflow

`main` is the only long-lived branch. Every change starts from it on a new branch named `feat/…`, `fix/…`, `chore/…`, `docs/…`, `refactor/…`, `test/…` or `ci/…`, and lands through a pull request. Commits follow Conventional Commits, enforced by commitlint.
