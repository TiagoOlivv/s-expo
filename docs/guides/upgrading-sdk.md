# Upgrading the Expo SDK

Written from the SDK 54 to 57 upgrade this repository went through. The order matters: each step's output is the next step's input.

## 1. Read the changelog first

[expo.dev/changelog](https://expo.dev/changelog) for every SDK you are skipping, not just the target. Breaking changes accumulate — the one that cost the most here landed in 56 and would have been invisible reading only the 57 notes.

## 2. Start clean

Green tests and a clean tree before you begin. Otherwise you cannot tell your breakage from the SDK's.

```bash
git checkout -b chore/upgrade-sdk-58
pnpm check-all
```

## 3. Bump

```bash
pnpm expo install expo@^58.0.0
pnpm expo install --fix
```

`--fix` aligns the packages Expo manages. It does **not** touch everything: dev dependencies, and libraries Expo does not own, stay where they are.

## 4. Let the doctor drive

```bash
pnpm dlx expo-doctor@latest
```

Fix what it reports, re-run, repeat until it is 21/21. It catches version mismatches that nothing else surfaces until runtime.

When a package must stay off the version Expo expects, add it to `expo.install.exclude` in `package.json` rather than silencing the check.

## 5. Check the peers Expo does not manage

The doctor will not always catch a peer conflict between two third-party packages. Read the install warnings.

In the 54 to 57 upgrade, `react-native-worklets` sat at `^0.7.2` while `reanimated` 4.5 required `0.10.x` — neither `--fix` nor the doctor flagged it until the versions were compared by hand.

Bump libraries Expo does not own separately: Uniwind, Zustand, TanStack, and anything else in `dependencies` that is not an `expo-*` package.

## 6. Type-check, then bundle

```bash
pnpm type-check
pnpm expo export --platform ios
pnpm expo export --platform android
```

**The bundle is the real test.** Type-checking passes on code the bundler rejects: the "expo-router no longer supports React Navigation" error in SDK 56 is a bundler-time check that `tsc` knows nothing about. A green `tsc` with no export is not a validated upgrade.

If a bundle fails inside `node_modules` rather than your code, the dependency tree is inconsistent — `rm -rf node_modules && pnpm install` before investigating further.

## 7. Run everything

```bash
pnpm check-all
pnpm dlx expo-doctor@latest
```

## 8. Then build native

`pnpm prebuild --clean` and a real device build. Some breakage only exists in native land, and a config plugin that no longer applies will not show up in any of the steps above.

## What actually broke, last time

Kept as a reminder of the shape these problems take:

- **expo-router dropped React Navigation in SDK 56.** Application code may no longer import `@react-navigation/*`; the imports move to `expo-router/react-navigation`. There is a codemod: `pnpm dlx expo-codemod sdk-56-expo-router-react-navigation-replace src`.
- **A transitive dependency stopped being transitive.** `@react-navigation/native` was never declared here — it resolved because `.npmrc` sets `node-linker=hoisted`. Relying on a package you did not declare works until the day it does not.
- **TypeScript 6 stopped auto-including `@types/*`.** Every test file lost `describe` and `expect`. `@types/jest` publishes a dist-tag per compiler version; the fix was the version matching `ts6.0`, plus naming `jest` in `compilerOptions.types`.
- **`newArchEnabled` was removed from `ExpoConfig`.** The new architecture is always on.
- **Packages became config plugins.** SDK 57 asked for `expo-image` and `expo-status-bar` to be registered. Both were unused here and were removed instead — check whether you need a package before adding its plugin.
