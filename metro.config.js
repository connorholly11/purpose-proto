const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  
  // Add aliasing for modules that need web stubs
  config.resolver.extraNodeModules = {
    ...(config.resolver.extraNodeModules || {}),
    'instabug-reactnative': __dirname + '/src/stubs/instabug-reactnative.ts',
    'expo-notifications': __dirname + '/src/stubs/expo-notifications.ts',
    'expo-device': __dirname + '/src/stubs/expo-device.ts',
  };
  
  // Add blacklist to prevent any Instabug internals from being pulled into web bundle
  config.resolver.blacklistRE = exclusionList([/instabug-reactnative\/dist\/.*/]);
  
  return config;
})();