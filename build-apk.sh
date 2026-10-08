#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${ROOT_DIR}/dist"
OUTPUT_FILE="${OUTPUT_DIR}/psrepo-preview.apk"

cd "${ROOT_DIR}"
mkdir -p "${OUTPUT_DIR}"

if [[ -z "${ANDROID_HOME:-}" && -d "/usr/lib/android-sdk" ]]; then
  export ANDROID_HOME="/usr/lib/android-sdk"
fi

if [[ -z "${ANDROID_SDK_ROOT:-}" && -n "${ANDROID_HOME:-}" ]]; then
  export ANDROID_SDK_ROOT="${ANDROID_HOME}"
fi

if [[ -z "${GRADLE_USER_HOME:-}" ]]; then
  export GRADLE_USER_HOME="${ROOT_DIR}/.gradle-cache"
fi

echo "Installing dependencies from bun.lock..."
bun install --frozen-lockfile

echo "Building Android APK locally..."
bunx eas-cli@latest build \
  --platform android \
  --profile preview \
  --local \
  --non-interactive \
  --output "${OUTPUT_FILE}"

echo
echo "APK created at:"
echo "${OUTPUT_FILE}"
