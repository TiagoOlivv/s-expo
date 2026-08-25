# End-to-end testing

[Maestro](https://maestro.dev) drives the built app from the outside. Flows are YAML, they touch no application code, and they run against the real binary.

```
.maestro/
├─ config.yaml        which flows run, and in what order
└─ app/home.yaml      the start screen
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

## In CI

Two workflows, both free, neither needing a secret:

| Entry point | APK from | Trigger |
| --- | --- | --- |
| `e2e-android.yml` | Gradle, inside GitHub Actions | manual, from the Actions tab |
| `.eas/workflows/e2e-test-android.yml` | EAS Build, `e2e-test` profile | manual, `eas workflow:run` |
| `e2e-android-eas-build.yml` | an EAS build URL you paste | manual, from the Actions tab |

**Nothing here runs automatically.** Every path is manual, on purpose. A full Android build plus an emulator run is about fifteen minutes of runner time, metered on a private repository, and the EAS paths spend build credits — so none of it should fire before you have decided the cost is worth paying.

The trigger to add is written in a comment at the top of each file. The EAS path is the one to reach for once an EAS project exists: it builds the artifact the same way a release does, and `eas.json` already carries an `e2e-test` profile for it.

### The app id

`.maestro/app/home.yaml` names the app id directly rather than taking it from `-e APP_ID`, because the EAS `maestro` job does not pass one. All three runners build the **development** variant, so `com.myapptemplate.development` is correct everywhere. Change it together with `BUNDLE_IDS` and `PACKAGES` in `env.ts` — a mismatch fails with a launch error that looks nothing like its cause.

Maestro Cloud is deliberately not used. It is a good product and it is paid; both workflows here run on a GitHub-hosted emulator instead.

## Keeping flows honest

The flow in this repository has been verified statically — every `testID` it references exists — but not executed, because this environment has no JVM. Treat it as unproven until it has run green once. A flow that has never passed is a liability: when it eventually fails you will not know whether it found a bug or was always broken.
