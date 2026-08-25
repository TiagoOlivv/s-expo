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

| Workflow | APK from | Trigger |
| --- | --- | --- |
| `e2e-android.yml` | Gradle, inside GitHub Actions | every pull request to `main` |
| `.eas/workflows/e2e-test-android.yml` | EAS Build, `e2e-test` profile | every pull request to `main` |
| `e2e-android-eas-build.yml` | an EAS build URL you paste | manual, from the Actions tab |

**E2E is mandatory on a pull request**, on both automatic paths. They are independent on purpose: the GitHub one needs no EAS account and works on a fresh clone, the EAS one exercises an artifact built the same way a release is.

They cost real money. The GitHub path is roughly fifteen minutes of runner time per pull request, and those minutes are metered on a private repository. The EAS path spends build credits. If that bites, gate them: `pull_request_labeled` on the EAS side, an `if:` on a label for the GitHub one.

### The app id

`.maestro/app/home.yaml` names the app id directly rather than taking it from `-e APP_ID`, because the EAS `maestro` job does not pass one. All three runners build the **development** variant, so `com.myapptemplate.development` is correct everywhere. Change it together with `BUNDLE_IDS` and `PACKAGES` in `env.ts` — a mismatch fails with a launch error that looks nothing like its cause.

Maestro Cloud is deliberately not used. It is a good product and it is paid; both workflows here run on a GitHub-hosted emulator instead.

## Keeping flows honest

The flow in this repository has been verified statically — every `testID` it references exists — but not executed, because this environment has no JVM. Treat it as unproven until it has run green once. A flow that has never passed is a liability: when it eventually fails you will not know whether it found a bug or was always broken.
