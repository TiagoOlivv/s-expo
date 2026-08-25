# Imports

## Absolute across folders, relative within a feature

```tsx
// crossing a folder boundary — absolute
import { Text, View } from '@/components/ui';
import { translate } from '@/lib/i18n';

// inside the same feature — relative
import { PreferencesBar } from './components/preferences-bar';
```

`@/` maps to `src/`, declared in `tsconfig.json` under `paths` and mirrored in `babel.config.js` for the bundler. Both have to agree; changing one alone breaks either the editor or the build.

`env.ts` sits at the repository root and is imported as `import Env from 'env'`, which is why `tsconfig.json` carries an explicit `env` path entry.

## Never a barrel inside a feature

```tsx
// ✗ breaks Fast Refresh
import { HomeScreen } from '@/features/home';

// ✓
import { HomeScreen } from '@/features/home/home-screen';
```

An `index.ts` that re-exports a feature's modules makes every file in it part of one refresh boundary, so editing any of them remounts all of them and you lose component state on every save. `components/ui/index.tsx` is a deliberate exception: it is a stable design-system surface, not a feature.

## Never sideways between features

```tsx
// ✗ from features/checkout
import { useCartStore } from '@/features/cart/use-cart-store';
```

Move the shared piece up to `lib/` or `components/ui/` instead. See [../architecture/overview.md](../architecture/overview.md#the-dependency-rule).

## Ordering

`perfectionist/sort-imports` decides the order and `eslint --fix` applies it. Do not sort by hand and do not argue with it — run `pnpm lint:fix`.
