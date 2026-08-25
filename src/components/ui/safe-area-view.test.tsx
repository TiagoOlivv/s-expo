import { SafeAreaView as ContextSafeAreaView } from 'react-native-safe-area-context';

import { SafeAreaView } from './safe-area-view';

describe('safeAreaView', () => {
  // Uniwind's Metro resolver only swaps imports coming from 'react-native'
  // (node_modules/uniwind/src/bundler/adapters/metro/resolvers.ts). A component
  // re-exported straight from a third-party package therefore never learns what
  // className means: native silently drops the prop, while web still styles it
  // through the DOM. Wrapping is the only thing that keeps the two in sync.
  it('is wrapped for Uniwind rather than re-exported as-is', () => {
    expect(SafeAreaView).not.toBe(ContextSafeAreaView);
  });
});
