#!/bin/sh

set -e

# --- Generating the build informations ---
SRC_DIR=${BUILD_DIR:-src}
APP_VERSION="$SRC_DIR/app-version.ts"
LENGTH=${1:-short}

# --- Getting the latest git commit ---
if [ -n "$GIT_SHA" ]; then
  SHA="$GIT_SHA"
else
  if [ "$LENGTH" = "long" ]; then
    SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
  else
    SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
  fi
fi

# --- Build date and time
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# --- Generating the app version content ---
BUILD_INFO="//Update the app version with the latest commit id and build time
export const GIT_SHA = \"${SHA}\";
export const BUILD_TIMESTAMP = \"${TIMESTAMP}\";
"

# --- Checking if there is changes compared the previous app version ---
if [ -f "$APP_VERSION" ]; then
  EXISTING=$(cat "$APP_VERSION")
  if [ "$EXISTING" = "$BUILD_INFO" ]; then
    echo "No changes — $APP_VERSION already up to date."
    exit 0
  fi
fi

echo "$BUILD_INFO" > "$APP_VERSION"
echo "Updated app version : $APP_VERSION to latest commit (SHA=${SHA})"

npm run build
mv build/static/css/* build/.
mv build/static/js/* build/.
rm -rf build/static
sed -i -e 's/\/static\/js/\./g' build/index.html
sed -i -e 's/\/static\/css/\./g' build/index.html
cd build
zip ../report.zip *