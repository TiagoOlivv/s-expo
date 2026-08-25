# Naming

## Files

Every file is `kebab-case`, including the ones that export a `PascalCase` component. ESLint enforces this through `unicorn/filename-case`, so a stray `HomeScreen.tsx` fails the lint job.

| Kind | Pattern | Example |
| --- | --- | --- |
| Screen | `<feature>-screen.tsx` | `home-screen.tsx` |
| Component | `<what-it-is>.tsx` | `preferences-bar.tsx` |
| Hook | `use-<thing>.tsx` | `use-selected-theme.tsx` |
| Store | `use-<feature>-store.tsx` | `use-auth-store.tsx` |
| Feature API | `api.ts` | `api.ts` |
| Test | `<file-under-test>.test.ts(x)` | `home-screen.test.tsx` |
| Route | mirrors the URL segment | `index.tsx`, `[id].tsx` |

Locale files use the BCP 47 tag lowercased: `en-us.json`, `pt-br.json`. The tag keeps its canonical casing in code (`'en-US'`); only the filename is lowercased, because the lint rule applies to filenames.

## Exports

Named exports everywhere, with one exception: a route file must default-export its screen, because that is what Expo Router loads.

```tsx
// features/home/home-screen.tsx
export function HomeScreen() { /* … */ }

// app/index.tsx
export { HomeScreen as default } from '@/features/home/home-screen';
```

Avoid `export default` anywhere else. A default export can be imported under any name, so a rename stops propagating and the codebase drifts.

## Test IDs

`kebab-case`, describing the element rather than its position: `home-title`, `theme-button`. Maestro flows target these, so renaming one silently breaks an E2E test that no unit test covers. Grep `.maestro/` before changing a `testID`.

## Translation keys

One top-level object per feature, keys sorted alphabetically, leaves are strings:

```json
{
  "home": { "description": "…" },
  "preferences": { "theme": { "dark": "Dark" } }
}
```

`i18n-json/sorted-keys` enforces the ordering and `i18n-json/identical-keys` compares every locale against `en-us.json`, so a key added to one locale and forgotten in another fails `pnpm lint:translations`.
