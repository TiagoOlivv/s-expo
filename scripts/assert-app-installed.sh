#!/usr/bin/env bash
# Fails with a useful message when the installed APK does not contain the app id
# the Maestro flows launch.
#
# Called from the emulator step of e2e-android-eas-build.yml, which installs an
# APK someone pasted the URL of. An artifact from the wrong build profile
# installs cleanly and then fails inside Maestro with "Package ... is not
# installed", which reads like a broken flow rather than the wrong file.
#
# It lives in a file because reactivecircus/android-emulator-runner runs its
# `script:` one line at a time, each in a separate `sh -c`. Multi-line shell
# constructs break, and variables do not survive from one line to the next.

set -euo pipefail

APP_ID=$(grep -m1 '^appId:' .maestro/app/home.yaml | awk '{print $2}')

if [ -z "$APP_ID" ]; then
  echo "::error::Could not read appId out of .maestro/app/home.yaml."
  exit 1
fi

if [ -n "$(adb shell pm path "$APP_ID" 2>/dev/null)" ]; then
  echo "$APP_ID is installed."
  exit 0
fi

echo "::error::The APK does not contain $APP_ID, which every flow launches."
echo "Installed instead:"
adb shell pm list packages | grep "$(echo "$APP_ID" | cut -d. -f1-2)" || echo "  nothing matching"
echo ""
echo "The e2e-test profile is the one that matches:"
echo "  eas build --profile e2e-test --platform android"
exit 1
