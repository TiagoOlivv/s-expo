# Unit testing

Jest with the `jest-expo` preset and React Native Testing Library.

```bash
pnpm test              # once
pnpm test:watch        # watch
pnpm test:ci           # with coverage
```

## Test-driven, in that order

Write the failing test first, watch it fail for the reason you expect, then make it pass.

The middle step is the one people skip and the one that matters. A test that has never failed proves nothing — it may be asserting on the wrong element, or passing because of a typo. Seeing the red tells you the test is actually connected to the behaviour.

```bash
# 1. red
./node_modules/.bin/jest src/features/home --forceExit
# 2. write the implementation
# 3. green
./node_modules/.bin/jest src/features/home --forceExit
```

## Where tests live

Beside the file under test: `home-screen.tsx` next to `home-screen.test.tsx`. No `__tests__` directory. A test that is hard to find is a test that stops being maintained, and a feature you delete should take its tests with it.

## Rendering

Use the wrapper from `@/lib/test-utils`, never RNTL's `render` directly — the local one supplies the providers a screen needs.

```tsx
import { render, screen } from '@/lib/test-utils';

it('shows the description', () => {
  render(<HomeScreen />);
  expect(screen.getByTestId('home-description')).toBeOnTheScreen();
});
```

`setup()` from the same module adds a configured `userEvent` when a test needs interaction.

## What to assert

Query the way a user finds things: by text, by role, by label. Reach for `getByTestId` when the element has no accessible handle of its own — and note that a `testID` may also be load-bearing for a Maestro flow, so check `.maestro/` before renaming one.

Assert on rendered output and on behaviour, not on internal state. A test that asserts a component called `setState` breaks on every refactor while telling you nothing about whether the screen still works.

## Pure logic separately

Decisions that do not need a tree should not be rendered to be tested. `toggle-preferences.ts` exists precisely so the toggle rules can be asserted directly:

```ts
expect(nextTheme('dark')).toBe('light');
```

These run in milliseconds and fail with an unambiguous message. When a component test feels awkward to write, it is usually a sign that a decision inside it wants to be extracted.

## Native mocks

`jest-setup.ts` mocks the native modules — MMKV, reanimated, and others — that have no JS implementation under Jest. `__mocks__/moti.ts` replaces Moti's animated views with plain ones. Add a mock there when a new native dependency breaks the suite, rather than mocking it in individual tests.

## The single-file hang

Running Jest on one file can hang after the tests pass. MMKV and i18next leave handles open and Jest waits for them. Pass `--forceExit` for single-file runs; the full `pnpm test` run exits on its own.
