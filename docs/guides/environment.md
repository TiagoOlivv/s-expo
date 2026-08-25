# Environments

Three environments — `development`, `preview`, `production` — each with its own bundle id, package name and URL scheme. `env.ts` declares them and validates the result with Zod.

## Choosing one

```bash
pnpm env:use development     # or preview / production
pnpm start --clear
```

That copies `.env.<name>.example` onto `.env.local`, which is git-ignored and which Expo loads with precedence.

**No `.env` is committed**, and `.gitignore` refuses every `.env*` that is not an `.example`. A tracked env file only has to be edited carelessly once to put a credential into history — and history is public the moment the repository is.

| File | Tracked |
| --- | --- |
| `.env.development.example` | yes |
| `.env.preview.example` | yes |
| `.env.production.example` | yes |
| `.env.local` | no |

## Why examples rather than `.env.preview`

Expo loads only the standard dotenv names — `.env`, `.env.local`, `.env.[NODE_ENV]`, `.env.[NODE_ENV].local`. A file called `.env.preview` is never read. Expo also recommends against switching environments through `NODE_ENV`, because `expo export` forces it to `production` regardless of what you set.

So the per-environment files here are templates you copy, not files the bundler picks up.

## Adding a variable

1. Declare it in the Zod schema in `env.ts`.
2. Add it to `_env`, reading from `process.env`.
3. Add it to all three `.env.*.example` files.

Environment variables always arrive as strings. Anything that is not a string has to be converted on the way in:

```ts
// schema
EXPO_PUBLIC_RETRY_COUNT: z.number(),
// assembly
EXPO_PUBLIC_RETRY_COUNT: Number(process.env.EXPO_PUBLIC_RETRY_COUNT ?? 0),
```

## The `EXPO_PUBLIC_` prefix

Prefixed variables are **inlined into the JavaScript bundle in plain text**. Anyone with the app has them. They are for endpoints and feature flags, never for secrets.

Unprefixed variables — like `APP_BUILD_ONLY_VAR` — are available to `app.config.ts` at build time and are not readable from `src/`. Real secrets belong in EAS environment variables, not in any file here.

## Validation

`STRICT_ENV_VALIDATION=1` makes a schema failure throw instead of warn. The `prebuild:*` scripts set it, so a native build fails immediately on a missing variable rather than producing a binary that breaks at runtime.

## EAS builds

`eas.json` sets `EXPO_PUBLIC_APP_ENV` per build profile and reads the rest from the matching EAS environment. The local files play no part in an EAS build.

Before your first one, fill in `EXPO_ACCOUNT_OWNER` and `EAS_PROJECT_ID` in `app.config.ts` — both ship empty.

## Renaming the app

`env.ts` holds `NAME`, `BUNDLE_IDS`, `PACKAGES` and `SCHEMES`. Change all four when starting a real app.

Android package names accept only `[a-zA-Z0-9_]` per segment and each segment must start with a letter. **A hyphen is invalid** — `com.my-app` will not build.
