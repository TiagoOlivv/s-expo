import { View } from 'react-native';

const AnimatePresence = View;
const MotiView = View;

// Mirrors moti's useAnimationState: a state object the component drives
// imperatively. Tests only need it to exist and record transitions.
// eslint-disable-next-line react/no-unnecessary-use-prefix -- must match moti's exported name
function useAnimationState() {
  return {
    current: 'from',
    transitionTo: jest.fn(),
  };
}

module.exports = {
  AnimatePresence,
  View,
  MotiView,
  useAnimationState,
};
