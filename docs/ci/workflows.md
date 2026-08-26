# CI workflows

Twelve workflows in `.github/workflows/`. Only three run on an ordinary pull request; the rest are manual, event-driven or gated behind a label.

## What triggers what

```mermaid
flowchart LR
    PR["pull request<br/>to main"]
    PUSH["push<br/>to main"]
    TAG["push<br/>a tag"]
    REL["release<br/>published"]
    MAN["run by hand<br/>Actions tab"]
    CRON["schedule<br/>daily"]

    PR --> LINT["Lint TS"]
    PR --> TYPE["Type Check"]
    PR --> TEST["Tests"]
    PR -.->|"only if deps changed"| DOC["Expo Doctor"]

    PUSH --> LINT
    PUSH --> TYPE
    PUSH --> TEST
    PUSH -.->|"only if deps changed"| DOC
    PUSH -.->|"only if images changed"| IMG["Compress images"]

    MAN --> VER["New App Version"]
    MAN --> QA["EAS QA Build"]
    MAN --> PROD["EAS Production Build"]
    MAN --> E2EAS["E2E Android"]
    MAN --> E2EAS2["E2E from EAS APK"]

    TAG --> GHREL["New GitHub Release"]
    REL --> QA
    CRON --> STALE["Mark stale"]
```

Solid arrows always fire. Dotted arrows depend on a condition — a changed path, or a label on the pull request.

## On every pull request


| Workflow | Runs | Fails when |
| --- | --- | --- |
| `lint-ts.yml` | `eslint .` | a lint or formatting rule is broken |
| `type-check.yml` | `tsc --noemit` | types do not check |
| `test.yml` | `jest` | a unit test fails |

These three are the gate. They need no secret and finish in a couple of minutes. If you protect `main` with required status checks, these are the ones to require.

## Conditional

| Workflow | Trigger |
| --- | --- |
| `expo-doctor.yml` | pull request touching `package.json` or `pnpm-lock.yaml` |
| `e2e-android.yml` | manual only |
| `e2e-android-eas-build.yml` | manual, takes an EAS APK URL |
| `compress-images.yml` | pull request touching images |
| `stale.yml` | schedule |

## Release

| Workflow | Trigger | Needs |
| --- | --- | --- |
| `new-app-version.yml` | manual: patch, minor or major | `GH_TOKEN`, optional |
| `new-github-release.yml` | a pushed tag | — |
| `eas-build-qa.yml` | a published release, or manual | `EXPO_TOKEN` |
| `eas-build-prod.yml` | manual only | `EXPO_TOKEN` |

Those four form a chain:

```mermaid
flowchart TD
    START(["you pick patch / minor / major"]) --> VER["New App Version"]
    VER --> BUMP["bump version in package.json<br/>run prebuild so native matches"]
    BUMP --> TAG["push a tag"]
    TAG --> GHREL["New GitHub Release<br/>triggered by the tag"]
    GHREL --> PUB["release published"]
    PUB --> QA["EAS QA Build<br/>preview profile, both platforms"]

    PROD["EAS Production Build"]
    MANUAL(["a separate, deliberate decision"]) --> PROD

    TAG -.->|"no GH_TOKEN:<br/>the chain stops here, silently"| DEAD(["nothing fires"])
```

*New App Version* bumps the version and pushes a tag, the tag publishes a GitHub release, and the published release starts the QA build. Production stays manual and outside the chain, so nothing reaches a store without someone deciding it should.

The chain has one failure mode that looks like nothing happening at all. A push made with the automatic `GITHUB_TOKEN` does not trigger other workflows, so without a `GH_TOKEN` the tag lands and *New GitHub Release* never fires.

## Secrets

| Secret | Used by | What it is | Required |
| --- | --- | --- | --- |
| `EXPO_TOKEN` | both EAS build workflows | an access token from [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens); authenticates `eas build` | yes, for any EAS build |
| `GH_TOKEN` | `new-app-version.yml` | a PAT with repository write, used to push the version bump and tag | no |

`GITHUB_TOKEN` appears in several workflows and is injected automatically — do not add it.

`GH_TOKEN` is optional because the workflow falls back to `GITHUB_TOKEN`. The difference matters at the edge: a push made with `GITHUB_TOKEN` does not trigger other workflows, so a tag created that way will not start the release build. Supply a PAT if you want that chain to fire.

Nothing here uses `MAESTRO_CLOUD_API_KEY`. Maestro Cloud is paid and this template does not depend on it.

## EAS

The project is linked: `@tiagoolivv/s-expo`, with `EXPO_ACCOUNT_OWNER` and `EAS_PROJECT_ID` filled in at the top of `app.config.ts`. When this template seeds a new app, run `eas init` and replace both.

`eas init` cannot write them for you. A dynamic config — `app.config.ts` rather than `app.json` — is read-only to the CLI, so the command prints the id and stops with `Cannot automatically write to dynamic config`. That is expected, not a failure.

### Environment variables live on EAS, not in your `.env`

Each profile in `eas.json` names an `environment`, and that points at an environment on Expo's servers. EAS Build has no access to your machine, so `.env.local` is invisible to it.

`prebuild` runs with `STRICT_ENV_VALIDATION=1` and aborts without `EXPO_PUBLIC_API_URL` — the same failure that took the GitHub workflow down before the variable was supplied there. All three environments have it set:

```bash
eas env:set --environment development --name EXPO_PUBLIC_API_URL \
  --value https://api.dev.example.com/ --visibility plaintext --scope project
```

`plaintext` because any `EXPO_PUBLIC_` value is inlined into the bundle in clear text regardless. Marking it secret would be theatre.

The value in **production** is still the placeholder. Point it at the real API before a production build.

### There is no EAS workflow

`.eas/` does not exist here, and EAS runs no tests for this project. `maestro_test` is a paid job type: on a free plan `eas workflow:validate` rejects such a workflow outright, so it could not be validated, let alone run.

EAS is used for builds and submissions. Everything that runs tests runs on GitHub Actions.

If the plan changes, [the EAS Workflows docs](https://docs.expo.dev/eas/workflows/get-started/) cover the syntax, and the `e2e-test` profile in `eas.json` already builds the right artifact.

## Environments

`APP_ENV` in a workflow must name a profile that exists in `eas.json`: `development`, `preview`, `production` or `simulator`. The upstream template used `staging`, which does not exist here — that mismatch made `pnpm prebuild:staging` fail and is worth remembering if you copy a workflow from elsewhere.

## Runners

Every job runs on `ubuntu-latest`. Nothing here uses a macOS runner, including the Android emulator job that upstream pointed at one.

Three reasons, in order of weight. A macOS minute bills at ten times an Ubuntu minute on a private repository, so a fifteen-minute emulator run spends a hundred and fifty of the two thousand free monthly minutes against about seven. `reactivecircus/android-emulator-runner` recommends Ubuntu outright and calls it two to three times faster. And `macOS-latest` is arm64 now, where `api-level: 29` has no system image at all — the job was aimed at a runner it could not have passed on.

Ubuntu asks for one thing in exchange: KVM, which the runner does not hand over by default. The udev rule at the top of the emulator job is what grants it.

### Disk

Both Android jobs remove about 12 GB of unused toolchains before doing anything — dotnet, GHC, Swift, Boost, CodeQL and the preinstalled docker images. `ubuntu-latest` ships with roughly 14 GB free, which an Android build plus an emulator system image does not fit into: the first run here died thirty-nine minutes in with `No space left on device`, and the runner took its own logs down with it.

`df` runs on both sides of the cleanup. When it is tight again, the log will say so instead of ending mid-sentence.

The Android SDK and its NDK are deliberately left in place. Some Expo modules still compile from source against them, and removing the NDK trades a disk problem for a download or a build failure.

### The AVD cache key

```yaml
key: avd-${{ runner.os }}-api${{ env.EMULATOR_API_LEVEL }}-${{ env.EMULATOR_PROFILE }}
```

The API level and the profile are job-level `env`, referenced by both the cache key and the emulator steps. The key used to be the literal string `avd-cache`, which survived any change to either value and handed back a snapshot of the old device — the flows would then have run against something nobody configured.

## The Node version is pinned for a reason

`.github/actions/setup-node-pnpm-install` asks for **Node 24**. Do not move it to 22.

`pnpm prebuild` fails there, on Linux, and only there:

```
Error: [android.dangerous]: withAndroidDangerousBaseMod:
       Could not find MIME for Buffer <null>
    at Jimp.parseBitmap (node_modules/jimp-compact/dist/jimp.js)
```

It was isolated on this repository with one variable — the same tree and the same actions, changing only `node-version`. 20 passes, 22 fails after twelve seconds, 24 passes. macOS is unaffected: the same prebuild runs clean there on Node 22.

The failure comes from `@expo/image-utils`, which pins `jimp-compact@0.16.1`. That pin is in the latest published version, so there is nothing upstream to upgrade to. Every development prebuild passes through it, because `app-icon-badge` in `app.config.ts` badges the icons for any environment that is not production.

Node 20 also works and is out of support, which is why 24 is the one written down.

## Running a check locally

Everything the gate does, `pnpm check-all` does:

```bash
pnpm check-all   # lint + type-check + translation lint + tests
```

Run it before pushing and CI stops being a surprise.
