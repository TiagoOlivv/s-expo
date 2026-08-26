#!/usr/bin/env node
// Renames the app, its display name and its bundle id, and offers to reset the
// version. Run it once on a fresh clone, before the first commit of a project.
//
//   pnpm rename <app-name> <bundle-id> [display-name]
//   pnpm rename my-app com.acme.myapp
//
// It walks an explicit list of files rather than sweeping the repository, and
// matches whole words only. That is not caution for its own sake: pnpm-lock.yaml
// contains the package `parse-imports-exports`, which holds the exact sequence
// `s-expo`, and a blind replace would quietly corrupt the lockfile.

const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');
const readline = require('node:readline');

const root = path.resolve(__dirname, '..');

// Every file allowed to change. Anything absent is reported and skipped.
const FILES = [
  'package.json',
  'env.ts',
  'app.config.ts',
  'claude.md',
  '.vscode/settings.json',
  '.maestro/app/home.yaml',
  '.maestro/app/language.yaml',
  '.maestro/app/theme.yaml',
  '.env.local',
  '.env.development.example',
  '.env.preview.example',
  '.env.production.example',
  'src/features/home/home-screen.test.tsx',
  'docs/ci/workflows.md',
  'docs/testing/e2e.md',
  'docs/guides/start-a-new-project.md',
];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function validate(appName, bundleId) {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(appName)) {
    fail(`"${appName}" is not a usable app name. Use lower-case kebab-case, starting with a letter: my-app.`);
  }

  const segments = bundleId.split('.');

  if (segments.length < 2) {
    fail(`"${bundleId}" needs at least two segments, like com.acme.myapp.`);
  }

  for (const segment of segments) {
    // Android accepts only letters, digits and underscore per segment, and each
    // must start with a letter. A hyphen fails inside Gradle, naming nothing.
    if (!/^[a-z]\w*$/i.test(segment)) {
      fail(`"${segment}" is not a valid segment of "${bundleId}". A hyphen will not build.`);
    }
  }
}

// `my-app` becomes `MyApp`, which is the shape env.ts expects for NAME.
function deriveDisplayName(appName) {
  return appName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Case-sensitive on purpose: `sexpo` (the editor's spelling dictionary) and
// `SExpo` (the display name) differ only in case, and matching loosely makes
// the first rule swallow the second.
function bounded(token) {
  return new RegExp(`(?<![a-zA-Z0-9-])${escapeRegExp(token)}(?![a-zA-Z0-9-])`, 'g');
}

function readIdentity() {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const env = fs.readFileSync(path.join(root, 'env.ts'), 'utf8');

  const displayName = env.match(/const NAME = '([^']+)'/)?.[1];
  const bundleId = env.match(/const BUNDLE_IDS = \{[\s\S]*?production: '([^']+)'/)?.[1];

  if (!displayName || !bundleId) {
    fail('Could not read NAME or BUNDLE_IDS.production out of env.ts. Has its shape changed?');
  }

  return { appName: pkg.name, displayName, bundleId };
}

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

async function main() {
  const [appName, bundleId, displayNameArgument] = process.argv.slice(2);

  if (!appName || !bundleId) {
    fail('Usage: pnpm rename <app-name> <bundle-id> [display-name]\n   eg: pnpm rename my-app com.acme.myapp');
  }

  validate(appName, bundleId);

  const current = readIdentity();
  const next = {
    appName,
    bundleId,
    displayName: displayNameArgument ?? deriveDisplayName(appName),
  };

  console.log(`  ${current.appName} -> ${next.appName}`);
  console.log(`  ${current.displayName} -> ${next.displayName}`);
  console.log(`  ${current.bundleId} -> ${next.bundleId}\n`);

  const resetVersion = await ask(
    `Reset the version from ${JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version} to 0.0.1? [y/N] `,
  );

  const compact = name => name.replace(/-/g, '');

  // The bundle id goes first, or `com.sexpo.app` is rewritten piecemeal.
  const replacements = [
    [bounded(current.bundleId), next.bundleId],
    [bounded(current.displayName), next.displayName],
    [bounded(current.appName), next.appName],
    [bounded(compact(current.appName)), compact(next.appName)],
  ];

  console.log('');

  for (const file of FILES) {
    const absolute = path.join(root, file);

    if (!fs.existsSync(absolute)) {
      console.log(`  absent   ${file}`);
      continue;
    }

    const before = fs.readFileSync(absolute, 'utf8');
    let after = replacements.reduce((text, [from, to]) => text.replace(from, to), before);

    if (file === 'package.json') {
      if (resetVersion) {
        after = after.replace(/("version":\s*)"[^"]+"/, '$1"0.0.1"');
      }

      after = after.replace(
        /("url":\s*)"git\+https:\/\/github\.com\/[^"]+"/,
        `$1"git+https://github.com/OWNER/${next.appName}.git"`,
      );
    }

    // Clearing these keeps builds out of the previous owner's Expo account.
    if (file === 'app.config.ts') {
      after = after
        .replace(/(const EXPO_ACCOUNT_OWNER = )'[^']*'/, '$1\'\'')
        .replace(/(const EAS_PROJECT_ID = )'[^']*'/, '$1\'\'');
    }

    if (after !== before) {
      fs.writeFileSync(absolute, after);
    }

    console.log(`  ${after === before ? 'no-op  ' : 'changed'}  ${file}`);
  }

  console.log(`
Still yours to do — none of it can be derived from a name:

  1. src/features/home/components/github-profile.tsx
     GITHUB_HANDLE still points at whoever this template came from. Change it,
     or delete the start screen along with its Maestro flows.

  2. npx eas-cli@latest login && npx eas-cli@latest init
     Then paste the project id into app.config.ts by hand. A dynamic config is
     read-only to the CLI, so it prints the id and stops.

  3. package.json "repository" now says OWNER. Put yours in, and point
     'git remote set-url origin' at the same place.

  4. docs/guides/start-a-new-project.md carries the rest: the two places
     EXPO_PUBLIC_API_URL has to exist, the token permissions, the ruleset.

Run pnpm check-all before committing.
`);
}

main();
