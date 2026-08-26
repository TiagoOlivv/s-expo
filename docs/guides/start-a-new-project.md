# Starting a new project from this template

Everything below was learned by doing it once, in order, and hitting each wall. Follow it and the walls are already gone.

The template is complete except for one thing: the idea. When these steps are done, the pipeline builds, tests, releases and ships — and the first real commit is a feature.

## 1 · Name the project

Three names and one identifier, all currently `s-expo`:

| What | Where | Current |
| --- | --- | --- |
| package name, slug, URL scheme | `package.json`, `env.ts` (`SCHEMES`) | `s-expo` |
| display name | `env.ts` (`NAME`) | `SExpo` |
| bundle id / Android package | `env.ts` (`BUNDLE_IDS`, `PACKAGES`) | `com.sexpo.app` |
| repository URL | `package.json`, `git remote` | `TiagoOlivv/s-expo` |

They also appear in `.maestro/app/*.yaml`, `.vscode/settings.json` (`cSpell.words`), the `.env.*.example` headers and the README. One pass with a search catches all of them:

```bash
grep -ril "s-expo\|sexpo\|SExpo" --exclude-dir=node_modules --exclude-dir=.git .
```

**The bundle id is permanent once an app ships.** Android package names accept only `[a-zA-Z0-9_]` per segment and each segment must start with a letter — a hyphen will not build. Reverse-DNS with a domain you own, or with your handle, avoids collisions; a bare product name does not.

The Maestro flows carry the app id directly, because the EAS `maestro` job does not pass `-e APP_ID`. Change them together with `env.ts` or the flows launch an app that is not there.

## 2 · Pick an environment

```bash
pnpm env:use development
```

No `.env` is committed and none ever should be. That command copies `.env.development.example` onto `.env.local`, which is git-ignored. `env.ts` validates `EXPO_PUBLIC_API_URL` as a URL, and `pnpm prebuild:<environment>` aborts without one.

`EXPO_PUBLIC_` values are inlined into the JavaScript bundle in plain text. They are for endpoints and feature flags. **Never a secret** — anyone with the app binary has them.

## 3 · Link the project to EAS

```bash
npx eas-cli@latest login
npx eas-cli@latest init
```

`eas init` prints the project id and then stops with `Cannot automatically write to dynamic config`. That is expected, not a failure: `app.config.ts` is a dynamic config and the CLI cannot edit it. Copy the id in by hand:

```ts
const EXPO_ACCOUNT_OWNER = 'your-account';
const EAS_PROJECT_ID = 'the-uuid-eas-init-printed';
```

Confirm with `npx eas-cli@latest project:info`.

### The environment variables live on EAS, not in your `.env`

Each profile in `eas.json` names an `environment`, and that points at an environment on Expo's servers. **EAS Build cannot see your machine.** The prebuild it runs validates strictly, so without this the build dies before it starts:

```bash
for env in development preview production; do
  npx eas-cli@latest env:set --environment $env --name EXPO_PUBLIC_API_URL \
    --value https://your-api.example --visibility plaintext --scope project
done
```

`plaintext` is correct. Marking an `EXPO_PUBLIC_` value secret would be theatre — it ships in the binary regardless.

## 4 · Configure the repository

### Secrets

| Secret | Where to get it | Needed for |
| --- | --- | --- |
| `EXPO_TOKEN` | [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens) | every EAS build |
| `GH_TOKEN` | [github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens) | the whole release chain |

`GH_TOKEN` must be a fine-grained token scoped to the repository with **Contents: read and write** *and* **Pull requests: read and write**. Each permission fails differently and neither error names the missing one:

```
missing Contents        remote: Write access to repository not granted
missing Pull requests   Resource not accessible by personal access token
```

Editing a fine-grained token's permissions does not change its value, so a token already stored as a secret survives the fix. Fine-grained tokens expire; when one does, the release breaks and the message will not say why.

Set them yourself so the value never travels through a terminal transcript:

```bash
gh secret set EXPO_TOKEN --repo owner/name
gh secret set GH_TOKEN --repo owner/name
```

### Variables

`EXPO_PUBLIC_API_URL` as a **repository variable**, under *Settings → Secrets and variables → Actions → Variables*.

This is a different thing from the EAS environment variable in step 3, and both are needed. Two workflows run `pnpm prebuild` **on the GitHub runner**, before EAS is involved, and the EAS environment is invisible there. There is deliberately no fallback value: a missing variable stops the build and names itself, rather than producing a binary aimed at a domain nobody owns.

### Settings

*Settings → Actions → General → Allow GitHub Actions to create and approve pull requests.* Without it the image-compression workflow cannot open its pull request.

### Protect `main`

A ruleset requiring a pull request on `refs/heads/main`, with **no bypass actors**. The release automation is built around it rather than through it — see [../conventions/git.md](../conventions/git.md).

## 5 · The rule that breaks CI chains

**Nothing done with the automatic `GITHUB_TOKEN` triggers another workflow.** Not a pushed branch, not a pushed tag, not a created release.

It exists to stop workflows looping on themselves, and it is the single reason `GH_TOKEN` is required. Every step in this repository that starts the next one is handed `secrets.GH_TOKEN` explicitly. Each link was found by watching it fail silently:

| Link | With `GITHUB_TOKEN` |
| --- | --- |
| the release pull request | opens, and no gates run on it |
| the tag | pushes, and no release is published |
| the release | publishes, and no EAS build starts |

All three look exactly like nothing happening.

## 6 · What to expect the first time

**The first production build creates a keystore.** `✔ Created keystore`, generated non-interactively and stored by EAS. An Android keystore cannot be replaced: lose it without a backup and the Play Store will never accept another update to that package. Letting EAS hold it is the safe default.

**Build numbers initialise on the first `preview` or `production` build.** `eas.json` sets `appVersionSource: remote`, so `versionCode` lives on Expo's servers and `autoIncrement` raises it per build. The counters are scoped per application identifier, so `com.example.app` and `com.example.app.preview` count separately. That is correct, not a bug.

**Prebuild fails intermittently on Linux** — roughly one run in four, with `Could not find MIME for Buffer <null>`. It is a race inside `app-icon-badge`, which reads back an icon it is still writing. Both CI call sites already retry three times. Re-run before suspecting your assets.

**Both EAS build workflows are Android only.** They pass `IOS: false`; the composite keeps the input and the step. Flip them once an Apple Developer account exists.

## 7 · Before the first feature

```bash
pnpm check-all
```

Then read [../workflow.md](../workflow.md). It is the loop every change goes through, and the first document an AI agent should be given.

## Checklist

- [ ] Names and bundle ids replaced everywhere, including `.maestro/app/*.yaml`
- [ ] `git remote` points at the new repository
- [ ] `pnpm env:use <environment>` run, `.env.local` exists
- [ ] `eas init` done, `EXPO_ACCOUNT_OWNER` and `EAS_PROJECT_ID` filled in by hand
- [ ] `EXPO_PUBLIC_API_URL` set in all three EAS environments
- [ ] `EXPO_TOKEN` and `GH_TOKEN` secrets set, `GH_TOKEN` with both permissions
- [ ] `EXPO_PUBLIC_API_URL` set as a repository variable
- [ ] Actions allowed to create pull requests
- [ ] Ruleset protecting `main`
- [ ] `pnpm check-all` green
- [ ] `GITHUB_HANDLE` in `src/features/home/components/github-profile.tsx` changed, or the start screen deleted along with its flows
