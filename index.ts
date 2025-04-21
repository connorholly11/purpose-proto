import { registerRootComponent } from 'expo';
import { LogBox } from 'react-native';

/**  Catch anything thrown before React renders  */
// Use type assertion to access the RN-specific ErrorUtils
(global as any).ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
  console.error('[GLOBAL]', error.message, error.stack, isFatal);
  // Optionally, send to error reporting service here
});

/**  Optional: silence unrelated new-arch warnings  */
LogBox.ignoreLogs([
  'ViewPropTypes will be removed',          // react-native-paper
  'Require cycle:',                       // Common in RN, often harmless
  // Add other noisy warnings if needed
]);

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
