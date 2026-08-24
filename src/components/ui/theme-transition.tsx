import { MotiView, useAnimationState } from 'moti';
import * as React from 'react';
import { StyleSheet } from 'react-native';
import { useUniwind } from 'uniwind';

/** How far the screen dims at the midpoint of the swap. */
const DIM_OPACITY = 0.4;
const DURATION_MS = 170;

/**
 * Cross-fades the app whenever the Uniwind theme changes.
 *
 * Uniwind swaps the colours synchronously, which reads as a hard jump. This dips
 * the opacity and brings it back, so the swap lands mid-fade. The subtree is
 * animated in place rather than remounted on theme change, so navigation state
 * and component state survive the transition.
 */
export function ThemeTransition({ children }: { children: React.ReactNode }) {
  const { theme } = useUniwind();
  const isFirstRender = React.useRef(true);
  const animationState = useAnimationState({
    from: { opacity: 1 },
    dim: { opacity: DIM_OPACITY },
    full: { opacity: 1 },
  });

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    animationState.transitionTo('dim');
    const timer = setTimeout(() => animationState.transitionTo('full'), DURATION_MS);
    return () => clearTimeout(timer);
  }, [theme, animationState]);

  return (
    <MotiView
      state={animationState}
      transition={{ type: 'timing', duration: DURATION_MS }}
      style={styles.container}
    >
      {children}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
