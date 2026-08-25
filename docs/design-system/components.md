# Design system

`src/components/ui/` holds what is reusable and free of domain meaning.

## What is here

| File | What it gives you |
| --- | --- |
| `text.tsx` | `Text` with a `tx` prop that translates a typed key |
| `focus-aware-status-bar.tsx` | status bar styling that only applies while the screen is focused |
| `use-theme-config.tsx` | maps the Uniwind theme onto a navigation theme |
| `colors.js` | the palette as JavaScript values |
| `index.tsx` | the barrel, plus `View`, `Pressable`, `ScrollView`, `SafeAreaView` re-exported |

The kit is deliberately small. This template was trimmed to what the screen actually renders; the components that were removed — button, input, checkbox, select, modal — are preserved verbatim in [../reference/removed-patterns.md](../reference/removed-patterns.md). Copy one back when you need it rather than writing it again.

## Why React Native primitives are re-exported

```tsx
import { Pressable, Text, View } from '@/components/ui';
```

One import site for the whole visual layer. When `View` eventually needs to become a wrapper, it changes here and no call site moves.

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
