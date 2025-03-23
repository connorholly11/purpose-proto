const path = require('path');
const moduleAlias = require('module-alias');

// Add aliases for module resolution
moduleAlias.addAliases({
  '@': path.resolve(__dirname, '../src')
});

// Register the aliases
moduleAlias(); 