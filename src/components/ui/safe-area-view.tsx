import { SafeAreaView as ContextSafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

/**
 * `SafeAreaView` with `className` support.
 *
 * Uniwind teaches components about `className` through its Metro resolver, which
 * only rewrites imports coming from `react-native`. Anything from another package
 * — this one included — keeps receiving `className` as a prop it does not know,
 * and drops it. Native then renders unstyled while web still applies the class
 * through the DOM, so the bug only ever shows up on a device.
 *
 * `withUniwind` maps `className` onto `style`, which is what closes that gap.
 * React Native ships its own `SafeAreaView`, and Uniwind supports it out of the
 * box, but it is iOS-only and deprecated — no use in a template that targets
 * both platforms.
 */
export const SafeAreaView = withUniwind(ContextSafeAreaView);
