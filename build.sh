#!/bin/bash
# Build script for Pop TB extension

BROWSER=$1

if [ "$BROWSER" != "chrome" ] && [ "$BROWSER" != "firefox" ]; then
  echo "Usage: ./build.sh [chrome|firefox]"
  exit 1
fi

echo "Building for $BROWSER..."

# Run webpack
npx webpack --env browser=$BROWSER --mode production

# Copy static files
echo "Copying static files..."
cp src/manifests/manifest.$BROWSER.json dist/$BROWSER/manifest.json
cp src/ui/popup.html dist/$BROWSER/
cp src/ui/popup.css dist/$BROWSER/

# Copy icons
if [ "$BROWSER" == "chrome" ]; then
  cp chrome/icon*.png dist/$BROWSER/ 2>/dev/null || true
else
  cp firefox/icon.svg dist/$BROWSER/ 2>/dev/null || true
fi

echo "Build complete! Output in dist/$BROWSER/"
