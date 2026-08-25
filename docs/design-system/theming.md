# Theming

Styling is Tailwind CSS 4 through **Uniwind**. This project does not use NativeWind — the two are not interchangeable, and answers written for NativeWind usually do not apply.

Uniwind runs as a Metro transformer (`metro.config.js`), not a Babel plugin, and reads its theme from CSS rather than a JS config.

## Where the theme lives

`src/global.css`, under `@theme`:

```css
@import 'tailwindcss';
@import 'uniwind';

@theme {
  --color-primary-500: #FF7B1A;
  --color-charcoal-950: #121212;
}
```

Every token there becomes a utility class: `--color-primary-500` gives `bg-primary-500`, `text-primary-500`, `border-primary-500`.

**Add colours as tokens, never as inline hex.** A literal `#FF7B1A` in a component cannot follow the theme, cannot be found by search, and cannot be changed in one place.

`src/components/ui/colors.js` mirrors the palette in JavaScript. It exists because React Navigation's theme object needs real values rather than class names — see `use-theme-config.tsx`. When you add a colour that navigation chrome uses, it goes in both.

## Light and dark

Uniwind resolves `dark:` variants itself. Write both in one class list:

```tsx
<Text className="text-neutral-600 dark:text-neutral-400" />
```

There is no `ThemeProvider` for styling and no context to read. Uniwind swaps the values under the classes.

## Switching themes

```ts
import { Uniwind } from 'uniwind';

Uniwind.setTheme('dark');   // 'light' | 'dark' | 'system'
```

`src/lib/hooks/use-selected-theme.tsx` wraps this: it persists the choice to MMKV and exposes `useSelectedTheme()`. `loadSelectedTheme()` runs at module scope in `src/app/_layout.tsx` so the stored theme is applied before the first paint.

`DEFAULT_THEME` in that file is `'dark'` — that is what a fresh install starts on.

Setting `'light'` or `'dark'` also calls React Native's `Appearance.setColorScheme`, so native dialogs match. It turns off adaptive theming: the app stops following the device until you set `'system'` again.

## Reading the resolved theme

```tsx
const { theme } = useUniwind();   // 'light' | 'dark', after 'system' resolves
```

Use this, not the stored preference, whenever you need to know what is actually on screen. `toggle-preferences.ts` shows why: a toggle driven by the stored value does the wrong thing when that value is `'system'`.

## Class ordering

`eslint-plugin-better-tailwindcss` sorts class lists and flags unknown classes. `pnpm lint:fix` applies it. It also collapses redundant pairs — `text-base leading-6` becomes `text-base/6`.
