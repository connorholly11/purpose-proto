# App Icons

We've simplified the PWA icon configuration to use a single favicon.ico file
instead of multiple PNG files.

The original manifest.json referred to:
- icon-192x192.png
- icon-512x512.png 
- apple-touch-icon.png

These files have been replaced with a single favicon.ico in the public directory.
If you want to add proper PWA icons in the future, you can create these PNG files
and update the manifest.json accordingly. 