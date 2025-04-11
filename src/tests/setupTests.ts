import '@testing-library/jest-native/extend-expect';
import { NativeModules } from 'react-native';

// Mock Platform to simulate different platforms during tests
const mockPlatform = (platform: 'ios' | 'android' | 'web') => {
  jest.resetModules();
  jest.doMock('react-native/Libraries/Utilities/Platform', () => ({
    OS: platform,
    select: (obj: any) => obj[platform] || obj.default || {},
  }));
};

// Export helpers for testing
export const setPlatform = {
  toIOS: () => mockPlatform('ios'),
  toAndroid: () => mockPlatform('android'),
  toWeb: () => mockPlatform('web'),
  // Reset to the actual platform
  reset: () => {
    jest.dontMock('react-native/Libraries/Utilities/Platform');
  },
};

// Mock modules that might not be available in the test environment
NativeModules.StatusBarManager = { getHeight: jest.fn(() => ({ then: jest.fn() })) };

// Mock Animated
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock LinearGradient from Expo
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  return {
    LinearGradient: ({ children, style }: any) => (
      <div className="mock-linear-gradient" style={style}>
        {children}
      </div>
    ),
  };
});

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const View = require('react-native').View;
  
  return {
    useSharedValue: jest.fn(initial => initial),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((toValue) => toValue),
    withSpring: jest.fn((toValue) => toValue),
    withSequence: jest.fn((a, b) => b),
    withRepeat: jest.fn((animation) => animation),
    default: {
      createAnimatedComponent: (Component: any) => React.forwardRef((props: any, ref: any) => {
        return <Component {...props} ref={ref} />;
      }),
      View,
    },
  };
});