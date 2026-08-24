# my-app-template

Opinionated Expo template for building responsive, multi-platform apps (phone and tablet, iOS and Android).

Derived from the [Obytes React Native starter](https://github.com/obytes/react-native-template-obytes) v9.0.0, then trimmed to a single scrollable start screen with no authentication.

## Stack

| Concern | Choice |
| --- | --- |
| Runtime | Expo SDK 54, React Native 0.81.5, React 19.1 |
| Routing | Expo Router 6 (file-based, typed routes) |
| Styling | Uniwind + Tailwind CSS 4 (`className`, theme via CSS `@theme`) |
| Server state | TanStack Query 5 + axios |
| Client state | Zustand 5 |
| Storage | react-native-mmkv 4 |
| i18n | i18next + react-i18next — `en-US` (default) and `pt-BR` |
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

Every change is written test-first.

## What ships

A single route rendering one screen: a title built from the app name plus `Starter`, and a one-line description. Nothing else. There is no authentication, no tab bar and no example feature — the first feature you add is the first feature in the app.

The design system in `src/components/ui` stays fully intact and tested, and `docs/reference/removed-patterns.md` keeps the working code for data fetching, stores, forms and settings rows that this template used to ship, so those conventions can be restored deliberately rather than reinvented.

## Project structure

```
src/
├─ app/            # Expo Router routes — thin re-exports only
├─ features/       # one folder per domain: screen, components/, api.ts, store
├─ components/ui/  # design system
├─ lib/            # infrastructure: api client, i18n, storage, hooks
└─ translations/   # en-us.json, pt-br.json
```

Dependency rule — imports only flow to the right:

```
app/  →  features/  →  components/ui/  →  lib/
```

A feature never imports another feature. Shared code moves up into `lib/` or `components/ui/`.

## Environments

`env.ts` recognises three environments — `development`, `preview` and `production` — and each one selects its own bundle id, package name and URL scheme.

Expo only loads the standard dotenv files (`.env`, `.env.local`, `.env.[NODE_ENV]`, `.env.[NODE_ENV].local`), and the Expo docs recommend against switching environments through `NODE_ENV`. So the per-environment files here are **examples**, not files Expo reads. Copy the one you want onto `.env.local`, which overrides `.env` and is git-ignored:

```bash
cp .env.development.example .env.local   # or .env.preview.example / .env.production.example
pnpm start --clear
```

| File | Purpose |
| --- | --- |
| `.env` | committed defaults, loaded on every run |
| `.env.local` | your active environment, git-ignored |
| `.env.development.example` | template for local development |
| `.env.preview.example` | template for preview / QA |
| `.env.production.example` | template for production values |

EAS builds do not use these files: `eas.json` sets `EXPO_PUBLIC_APP_ENV` per build profile and reads the rest from the matching EAS environment.

Never put a real secret in an `EXPO_PUBLIC_` variable — those are inlined in plain text into the app bundle.

## Before shipping a real app

- `app.config.ts` — set `EXPO_ACCOUNT_OWNER` and `EAS_PROJECT_ID` (both are intentionally empty)
- `env.ts` — rename `NAME`, `BUNDLE_IDS`, `PACKAGES`, `SCHEMES`
- `.env` — point `EXPO_PUBLIC_API_URL` at a real API

## Git workflow

`main` is the only long-lived branch. Every change starts from it on a new branch named `feat/…`, `fix/…`, `chore/…`, `docs/…`, `refactor/…`, `test/…` or `ci/…`, and lands through a pull request. Commits follow Conventional Commits, enforced by commitlint.
