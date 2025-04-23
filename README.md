# Instabug Expo Integration

This document explains how the Instabug integration works with Expo, specifically how we've fixed the `ERR_MODULE_NOT_FOUND` error that occurs when running web development.

## Problem

When running `expo start --web`, Instabug's Expo config plugin was causing an error:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module './models/Report'
```

This happened because Node.js's ESM resolver cannot handle imports without file extensions, which is required when the plugin file is executed to parse the Expo config.

## Solution

Our solution does the following:

1. **Gates the Instabug plugin behind an environment flag** in `app.config.ts`
2. **Uses dynamic imports for Instabug** in `App.tsx` to ensure Metro tree-shakes it out of web builds
3. **Adds an exclusion list in Metro config** to prevent Instabug internals from being pulled into web bundles
4. **Patches the Instabug package** to fix the import statement using `patch-package`

## Scripts

We've added the following npm scripts:

- `npm run dev:web` - Starts the web development server with Instabug plugin disabled
- `npm run dev:native` - Starts the Expo development server with Instabug plugin enabled
- `npm run ios` - Runs the iOS app with Instabug enabled
- `npm run android` - Runs the Android app with Instabug enabled

## Implementation Details

1. **app.config.ts**: Added `INCLUDE_INSTABUG_PLUGIN` environment flag control
2. **App.tsx**: Replaced static imports with dynamic imports
3. **metro.config.js**: Added exclusion list for Instabug internals
4. **package.json**: Added scripts and patch-package 
5. **patches/instabug-reactnative+12.4.0.patch**: Fixed the import statement

## For CI/CD

For EAS or Xcode builds, make sure to set `INCLUDE_INSTABUG_PLUGIN=true` in the build environment.