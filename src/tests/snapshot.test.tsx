import React from 'react';
import { render } from '@testing-library/react-native';
import { setPlatform } from './setupTests';
import { CrossPlatformExample } from '../components';
import { PaperProvider } from 'react-native-paper';
import { theme } from '../theme';

describe('Cross-platform component snapshots', () => {
  // Test CrossPlatformExample component on different platforms
  describe('CrossPlatformExample', () => {
    it('renders correctly on iOS', () => {
      setPlatform.toIOS();
      const { toJSON } = render(
        <PaperProvider theme={theme}>
          <CrossPlatformExample />
        </PaperProvider>
      );
      expect(toJSON()).toMatchSnapshot('CrossPlatformExample-ios');
    });

    it('renders correctly on Android', () => {
      setPlatform.toAndroid();
      const { toJSON } = render(
        <PaperProvider theme={theme}>
          <CrossPlatformExample />
        </PaperProvider>
      );
      expect(toJSON()).toMatchSnapshot('CrossPlatformExample-android');
    });

    it('renders correctly on Web', () => {
      setPlatform.toWeb();
      const { toJSON } = render(
        <PaperProvider theme={theme}>
          <CrossPlatformExample />
        </PaperProvider>
      );
      expect(toJSON()).toMatchSnapshot('CrossPlatformExample-web');
    });
  });

  // Reset platform after all tests
  afterAll(() => {
    setPlatform.reset();
  });
});

// Add tests for other key components as needed
// Following the same pattern above allows you to create visual regression tests
// for all your main UI components across platforms