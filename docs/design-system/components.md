# Design system

`src/components/ui/` holds what is reusable and free of domain meaning.

## What is here

| File | What it gives you |
| --- | --- |
| `text.tsx` | `Text` with a `tx` prop that translates a typed key |
| `focus-aware-status-bar.tsx` | status bar styling that only applies while the screen is focused |
| `use-theme-config.tsx` | maps the Uniwind theme onto a navigation theme |
| `colors.js` | the palette as JavaScript values |
| `safe-area-view.tsx` | `SafeAreaView` wrapped so `className` works on native |
| `index.tsx` | the barrel, plus `View`, `Pressable`, `Image`, `ScrollView`, `TouchableOpacity` and `ActivityIndicator` re-exported from `react-native` |

The kit is deliberately small. This template was trimmed to what the screen actually renders; the components that were removed — button, input, checkbox, select, modal — are preserved verbatim in [../reference/removed-patterns.md](../reference/removed-patterns.md). Copy one back when you need it rather than writing it again.

## Why React Native primitives are re-exported

```tsx
import { Pressable, Text, View } from '@/components/ui';
```

One import site for the whole visual layer. When `View` eventually needs to become a wrapper, it changes here and no call site moves.

## Third-party components need `withUniwind`

Uniwind adds `className` support through its Metro resolver, and that resolver only
rewrites imports coming from `react-native`. Everything else —
`react-native-safe-area-context`, `react-native-gesture-handler`, any UI library —
receives `className` as a prop it does not recognise, and drops it.

The failure is quiet and asymmetric. Web still styles the element, because
`className` lands on a real DOM node where Tailwind's CSS applies. Native renders
unstyled. The bug therefore survives every check that runs on a machine and shows
up only on a device.

Wrap the component once, in its own file under `src/components/ui/`:

```tsx
import { SafeAreaView as ContextSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

export const SafeAreaView = withUniwind(ContextSafeAreaView);
```

`withUniwind` maps `className` onto `style`, and `<prop>ClassName` onto
`<prop>Style`. `safe-area-view.tsx` is the reference.

Jest cannot catch this. It runs on the `jest-expo` preset with no Metro resolver,
so no `className` becomes a style there either — including for the components that
do work in the app. What a test can pin is that the export is wrapped rather than
passed straight through; `safe-area-view.test.tsx` does exactly that. Running the
app is the only real check.

## Adding a component

1. Write the test first — [../testing/unit.md](../testing/unit.md).
2. Create `src/components/ui/<name>.tsx`, `kebab-case`, named export.
3. Accept `className` and merge it last so callers can override:

```tsx
import { twMerge } from 'tailwind-merge';

export function Card({ className, ...props }: CardProps) {
  return (
    <View className={twMerge('rounded-lg bg-neutral-100', className)} {...props} />
  );
}
```

`twMerge` resolves conflicts rather than concatenating: a caller passing `bg-white` wins over the built-in `bg-neutral-100` instead of both landing in the class list. `text.tsx` is the reference for this.

4. Style with Tailwind classes only. No `StyleSheet.create`, no inline hex.
5. Export it from `index.tsx`.
6. Every user-facing string arrives as a prop or a translation key — never hardcoded inside the component.

`tailwind-variants` and `tailwind-merge` are installed for components with variants. Reach for them when a component grows a `size` or `intent` prop, not before.

## When it does not belong here

If it mentions a business concept — a cart, an invoice, a profile — it is a feature component and belongs in `src/features/<name>/components/`. The test is whether it would make sense in a different app.
