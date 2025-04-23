const { getDefaultConfig } = require('expo/metro-config');
module.exports = (() => {
  const config = getDefaultConfig(__dirname);
  config.resolver.extraNodeModules = {
    ...(config.resolver.extraNodeModules || {}),
    'instabug-reactnative': __dirname + '/src/stubs/instabug-reactnative.ts',
  };
  return config;
})();