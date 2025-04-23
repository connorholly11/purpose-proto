const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  
  // Add aliasing for modules that need web stubs using path.resolve for safety
  const path = require('path');
  config.resolver.extraNodeModules = {
    ...(config.resolver.extraNodeModules || {}),
    'instabug-reactnative': path.resolve(__dirname, 'src/stubs/instabug-reactnative.ts'),
    'expo-notifications': path.resolve(__dirname, 'src/stubs/expo-notifications.ts'), 
    'expo-device': path.resolve(__dirname, 'src/stubs/expo-device.ts'),
  };
  
  // Expanded blacklist to prevent any Instabug internal files from being pulled into the web bundle
  config.resolver.blacklistRE = exclusionList([
    /instabug-reactnative\/dist\/.*/,
    /instabug-reactnative\/.*\.podspec/
  ]);
  
  return config;
})();