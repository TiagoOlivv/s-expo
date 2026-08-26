# End-to-end testing

[Maestro](https://maestro.dev) drives the built app from the outside. Flows are YAML, they touch no application code, and they run against the real binary.

```
.maestro/
├─ config.yaml            which flows run, and in what order
└─ app/
   ├─ home.yaml           the start screen renders and every control is reachable
   ├─ language.yaml       switching the language re-renders the screen in place
   └─ theme.yaml          switching the theme flips the toggle in place
```

## Running locally

```bash
pnpm install-maestro    # once
pnpm e2e-test
```

Three things have to be in place first, and none of them is optional:

1. **A JVM.** Maestro runs on Java. `java -version` must answer.
2. **A built app installed on a simulator or emulator** — `pnpm ios` or `pnpm android`. Maestro drives an installed binary; it does not build one.
3. **A booted device**, with only one running. Maestro picks the connected device and gets confused by several.

The flow declares the app id itself, so build the **development** variant. Building `preview` and running the flow fails with a launch error that looks nothing like its real cause.

## Writing a flow

```yaml
appId: ${APP_ID}
---
- launchApp
- assertVisible:
    id: home-title
- tapOn:
    id: theme-button
- assertVisible:
    id: home-description
```

Target `testID`s, not visible text. Text moves with translation — a flow asserting `Settings` passes in English and fails the moment the device locale is Portuguese.

`scrollUntilVisible` is the right tool for content below the fold; a bare `assertVisible` fails on an element that exists but is off-screen.

### Persisted state, and why `clearState` is not used

The theme and the language live in MMKV, so they survive a restart and a flow cannot assume the state it starts in. The obvious fix is `clearState: true` — and on a development build it is the wrong one. It also wipes the dev client's stored server URL, so the app opens the launcher instead of the screen and every assertion after `launchApp` fails for a reason that has nothing to do with the flow.

`language.yaml` and `theme.yaml` normalise instead, with a conditional `runFlow` that reads the toggle's own accessibility label:

```yaml
- runFlow:
    when:
      visible:
        id: theme-button
        text: Switch to dark theme
    commands:
      - tapOn:
          id: theme-button
```

Each toggle is labelled with the value it would switch to, which makes that label a reliable read of the current state. Both flows also restore what they found, so the order in `config.yaml` carries no hidden coupling.

### What an `accessibilityLabel` hides

An `accessibilityLabel` on a `Pressable` makes iOS collapse its subtree into a single accessibility element. The child `Text` never reaches the hierarchy, so the emoji inside the theme toggle — and the `EN`/`PT` inside the language one — cannot be asserted at all; `assertVisible: "🌙"` fails against a perfectly working button.

Assert the label instead. It and the emoji are derived from the same value, so it is a faithful read of it. What no Maestro assertion covers is the colours themselves — only a screenshot diff would, and that is not set up here.

`maestro hierarchy`, run against the booted app, is what settles questions like this. It prints exactly what the flow can see, which is rarely all of what the screen shows.

## In CI

Two entry points, both on GitHub runners:

| Entry point | APK from | Trigger |
| --- | --- | --- |
| `e2e-android.yml` | Gradle, inside GitHub Actions | manual, from the Actions tab |
| `e2e-android-eas-build.yml` | an EAS build URL you paste | manual, from the Actions tab |

**EAS runs no tests for this project.** `maestro_test` is a paid job type, and on a free plan `eas workflow:validate` rejects a workflow that uses one, so there is no `.eas/` directory here. EAS builds artifacts; GitHub Actions runs the flows.

The `e2e-test` profile in `eas.json` earns its place anyway: it builds an unsigned APK, which is exactly what `e2e-android-eas-build.yml` expects you to paste in.

**`e2e-android.yml` is the path proven green**, on the emulator, in CI.

**Nothing runs automatically.** Both paths are manual, on purpose. A full Android build plus an emulator run is around an hour of runner time — metered while the repository is private, free once it is public — so it should not fire before you have decided the cost is worth paying.

The trigger to add is written in a comment at the top of each file.

### The app id

`.maestro/app/home.yaml` names the app id directly rather than taking it from `-e APP_ID`. Both workflows build the **development** variant, so `com.sexpo.app.development` is correct in either. Change it together with `BUNDLE_IDS` and `PACKAGES` in `env.ts` — a mismatch fails with a launch error that looks nothing like its cause.

Maestro Cloud is deliberately not used. It is a good product and it is paid; the workflows that run on the free tier use a GitHub-hosted emulator instead.

## Keeping flows honest

All three flows have run green twice in a row from a cold start against an iPhone 17e simulator, and once on the Android emulator in CI through `e2e-android.yml`. A flow that has never passed is a liability: when it eventually fails you will not know whether it found a bug or was always broken — so run a new one before committing it, and do not commit one that has only been read.
