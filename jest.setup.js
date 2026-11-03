jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));

jest.mock('react-native-reanimated', () => {
  const { View, Text, Image } = require('react-native');
  const Animated = {
    View,
    Text,
    Image,
    createAnimatedComponent: (Component) => Component,
  };
  const timing = (value) => value;
  return {
    __esModule: true,
    default: Animated,
    useSharedValue: (value) => ({ value }),
    useAnimatedStyle: (updater) => updater(),
    withTiming: timing,
    withRepeat: timing,
    withDelay: (_delay, value) => value,
    Easing: {
      bezier: () => (progress) => progress,
      out: (easing) => easing,
      in: (easing) => easing,
      cubic: (progress) => progress,
    },
    runOnJS: (fn) => fn,
  };
});
