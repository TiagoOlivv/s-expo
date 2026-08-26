# CI workflows

Thirteen workflows in `.github/workflows/`. Only three run on an ordinary pull request; the rest are manual, event-driven or gated behind a label.

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

    MAN --> VER["New App Version<br/>opens a bump PR"]
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
| `new-app-version.yml` | manual: patch, minor or major | `GH_TOKEN` |
| `tag-release.yml` | a merged `chore/release-v*` pull request | `GH_TOKEN` |
| `new-github-release.yml` | a pushed tag | `GH_TOKEN` |
| `eas-build-qa.yml` | a published release, or manual | `EXPO_TOKEN` |
| `eas-build-prod.yml` | manual only | `EXPO_TOKEN` |

They form a chain with a person in the middle of it:

```mermaid
flowchart TD
    START(["you pick patch / minor / major"]) --> VER["New App Version"]
    VER --> BUMP["bump the version in package.json"]
    BUMP --> PR["open chore/release-vX.Y.Z"]
    PR --> REVIEW{{"you review and merge"}}
    REVIEW --> TAGW["Tag Release<br/>triggered by the merge"]
    TAGW --> TAG["push the tag"]
    TAG --> GHREL["New GitHub Release<br/>triggered by the tag"]
    GHREL --> PUB["release published"]
    PUB --> QA["EAS QA Build<br/>preview profile"]

    PROD["EAS Production Build"]
    MANUAL(["a separate, deliberate decision"]) --> PROD
```

**The release does not write to `main` directly.** A ruleset protects `main` and requires a pull request, with no bypass actors — and a version bump is a change to `main` like any other, so it goes through the same door. `package.json` is the only file the bump touches: `env.ts` reads the version from it and `app.config.ts` reads that.

Trying it the other way is what led here. The old workflow ran `np`, which bumps, commits, tags and pushes to `main` in one go. `git push --follow-tags` is atomic per ref, not overall, so the tag landed and the branch was rejected:

```
remote: error: GH013: Repository rule violations found for refs/heads/main.
- Changes must be made through a pull request.
 * [new tag]         v0.0.2 -> v0.0.2
 ! [remote rejected] main -> main
```

That leaves a tag pointing at a commit no branch can reach. The ruleset covers `refs/heads/main` only, which is why the tag went through and why `tag-release.yml` needs no bypass.

### One rule breaks this chain in three places

**Nothing done with the automatic `GITHUB_TOKEN` triggers another workflow.** Not a pushed branch, not a pushed tag, not a created release. It exists to stop workflows from looping on themselves, and it is the single reason `GH_TOKEN` is required rather than optional.

Each link was found the same way — by running it and watching nothing happen:

| Link | With `GITHUB_TOKEN` | Symptom |
| --- | --- | --- |
| the release pull request | opened, but no gates run on it | a bump merged without lint, types or tests |
| the tag | pushed, but no release published | the tag sits there and the chain ends |
| the release | published, but no EAS build starts | the release page looks perfect and nothing builds |

The third one is the most convincing, because the release is created correctly:

```
v0.0.2 por github-actions[bot] (Bot)
```

`ncipollo/release-action` defaults to `github.token`, so the release came from the bot, and `eas-build-qa.yml` — which listens for `release: published` — never woke up. It had never run once.

Every step that starts the next one is handed `secrets.GH_TOKEN` explicitly.

## Secrets

| Secret | Used by | What it is | Required |
| --- | --- | --- | --- |
| `EXPO_TOKEN` | both EAS build workflows | an access token from [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens); authenticates `eas build` | yes, for any EAS build |
| `GH_TOKEN` | `new-app-version.yml`, `tag-release.yml`, `new-github-release.yml` | a fine-grained PAT with **Contents: read and write** and **Pull requests: read and write**, scoped to this repository | yes, for the release chain |

`GITHUB_TOKEN` appears in several workflows and is injected automatically — do not add it.

Both permissions were established by failure. Without Contents the branch push is refused with `Write access to repository not granted`; without Pull requests the run dies at `Resource not accessible by personal access token`. Editing a fine-grained token's permissions does not change its value, so the secret survives the fix.

Nothing here uses `MAESTRO_CLOUD_API_KEY`. Maestro Cloud is paid and this template does not depend on it.

## EAS

The project is linked: `@tiagoolivv/s-expo`, with `EXPO_ACCOUNT_OWNER` and `EAS_PROJECT_ID` filled in at the top of `app.config.ts`. When this template seeds a new app, run `eas init` and replace both.

`eas init` cannot write them for you. A dynamic config — `app.config.ts` rather than `app.json` — is read-only to the CLI, so the command prints the id and stops with `Cannot automatically write to dynamic config`. That is expected, not a failure.

### Environment variables live on EAS, not in your `.env`

Each profile in `eas.json` names an `environment`, and that points at an environment on Expo's servers. EAS Build has no access to your machine, so `.env.local` is invisible to it.

`prebuild` runs with `STRICT_ENV_VALIDATION=1` and aborts without `EXPO_PUBLIC_API_URL` — the same failure that took the GitHub workflow down before the variable was supplied there. All three environments have it set:

```bash
eas env:set --environment development --name EXPO_PUBLIC_API_URL \
  --value https://your-api.example --visibility plaintext --scope project
```

`plaintext` because any `EXPO_PUBLIC_` value is inlined into the bundle in clear text regardless. Marking it secret would be theatre.

Use `eas env:update` to change one, and `eas env:list --environment <name>` to see what a build will actually receive.

### And a repository variable, for the prebuild on the runner

Separate problem, separate place. `.github/actions/eas-build` runs `pnpm prebuild` **on the GitHub runner** before EAS is involved, and the EAS environment is not visible to that step. Same for `.github/actions/setup-jdk-generate-apk`, which builds the E2E APK with Gradle locally.

Both read `vars.EXPO_PUBLIC_API_URL`, a repository variable under *Settings > Secrets and variables > Actions > Variables*.

There is no fallback value. `env.ts` validates the variable as a URL and `prebuild` aborts without it — which is a clearer failure than a build quietly aimed at a domain nobody owns. If a workflow stops with:

```
❌ Invalid environment variables:{ "EXPO_PUBLIC_API_URL": [ "Invalid URL" ] }
```

the variable is missing, not the code.

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

## Prebuild fails intermittently on Linux

Roughly one Linux prebuild in four dies about twelve seconds in:

```
Error: [android.dangerous]: withAndroidDangerousBaseMod:
       Could not find MIME for Buffer <null>
    at Jimp.parseBitmap (node_modules/jimp-compact/dist/jimp.js)
    at FSReqCallback.readFileAfterClose
```

Both call sites — `.github/actions/eas-build` and `.github/actions/setup-jdk-generate-apk` — retry it three times, clearing `ios/` and `android/` between attempts. Three failures in a row is treated as a real failure, not the flake.

**It is a race, not a bad input.** `app-icon-badge` badges the icons for every environment that is not production: it writes `icon.png` and `foregroundImage.png` and reads them straight back through Jimp, which bundles `jimp-compact@0.16.1` by way of `@expo/image-utils`. A null buffer out of an async `readFile` is a file that had not finished being written. macOS never shows it; every observed failure has been on a Linux runner.

Things that were ruled out, each by running it:

| Suspected | Ruled out by |
| --- | --- |
| the PNG assets | valid 8-bit non-interlaced, and the committed blobs match the working tree byte for byte |
| the Node version | it has failed and passed on the same version; eight runs show no pattern |
| `preview` versus `development` | both succeeded back to back on one runner |
| `expo/expo-github-action` disturbing `node_modules` | prebuild succeeded straight after it |
| the `eas-build` composite | the exact path, reproduced with only the `eas build` call removed, succeeded |

An earlier version of this section blamed Node 22. That was written from a single failure and a single success, and more runs disproved it — the same Node 24 that was called safe has since failed. Node stays at 24 because it is supported, not because it fixes anything.

## Running a check locally

Everything the gate does, `pnpm check-all` does:

```bash
pnpm check-all   # lint + type-check + translation lint + tests
```

Run it before pushing and CI stops being a surprise.
