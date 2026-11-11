#!/usr/bin/env bash
# Usage: ./scripts/deploy.sh YOUR_FIREBASE_PROJECT_ID [hosting-only]
set -euo pipefail
PROJECT_ID="${1:-${FIREBASE_PROJECT_ID:-}}"
MODE="${2:-all}"
if [[ -z "$PROJECT_ID" ]]; then echo 'Usage: ./scripts/deploy.sh FIREBASE_PROJECT_ID [hosting-only]' >&2; exit 2; fi
if ! command -v firebase >/dev/null 2>&1; then echo 'Install firebase-tools and run firebase login first.' >&2; exit 2; fi
cd "$(dirname "$0")/.."
npm ci
npm run check
if [[ "$MODE" == 'hosting-only' ]]; then
  firebase deploy --only hosting --project "$PROJECT_ID"
else
  npm --prefix functions install
  firebase deploy --only functions,firestore,storage --project "$PROJECT_ID"
  firebase deploy --only hosting --project "$PROJECT_ID"
fi
