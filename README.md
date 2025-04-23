# Instabug Expo Integration

This document explains how the Instabug integration works with Expo, specifically how we've fixed the `ERR_MODULE_NOT_FOUND` error that occurs when running web development.

## Problem

When running `expo start --web`, Instabug's Expo config plugin was causing an error:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module './models/Report'
```

This happened because Instabug moved its type models (`models/Report` et al.) into a separate "models/" folder, but didn't ship the compiled files in the published npm tarball. The error occurred when Metro or the Expo config plugin tried to evaluate the real native library before our aliasing logic could replace it with a web stub.

## Solution

Our updated solution does the following:

1. **Upgrades Instabug** to version 11.12.1+ that fixes the missing compiled files
2. **Gates the Instabug plugin behind an environment flag** in `app.config.ts` with strong boolean coercion
3. **Added production-only guard** to prevent plugin auto-linking in dev environments
4. **Created an Instabug adapter** (`src/utils/instabug.ts`) that lazy-loads the module
5. **Improved Metro aliasing** with safer path resolution and expanded blacklist patterns
6. **Set INCLUDE_INSTABUG_PLUGIN=false as default** for safer initialization

## Scripts

We've updated the npm scripts for clarity:

- `npm start` - Starts the web development server with Instabug plugin disabled (default)
- `npm run start:native` - Starts the Expo development server with Instabug plugin enabled
- `npm run ios` - Runs the iOS app with Instabug enabled
- `npm run android` - Runs the Android app with Instabug enabled

**Note:** Run `npm run start:native` when you need to test on iOS with Instabug enabled.

## Implementation Details

1. **package.json**: Added resolution override for Instabug version and updated scripts
2. **app.config.ts**: Strengthened environment gating with explicit boolean coercion and extra guards
3. **src/utils/instabug.ts**: Created adapter for all Instabug functionality that isolates imports
4. **App.tsx**: Replaced direct requires with dynamic imports and adapter calls
5. **metro.config.js**: Improved aliasing with safer path resolution and expanded blacklist
6. **.env files**: Changed default INCLUDE_INSTABUG_PLUGIN to false for safety

## For CI/CD

For EAS or Xcode builds, the build profiles in eas.json already configure the appropriate environment variables. The production build profile should continue to include Instabug.

## Potential side-effects & mitigations

- **Upgrading Instabug to 11.12.1 modifies native Pod dependencies**: Commit updated Podfile.lock after running prebuild.
- **Stubbing module lazily means Instabug initializes slightly later**: Not a concern as initialization happens in an effect.
- **Default web start may confuse contributors**: Added note to README.md about using `npm run start:native` for iOS testing.