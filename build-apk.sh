#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${ROOT_DIR}/dist"
OUTPUT_FILE="${OUTPUT_DIR}/psrepo-preview.apk"

cd "${ROOT_DIR}"
mkdir -p "${OUTPUT_DIR}"

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
