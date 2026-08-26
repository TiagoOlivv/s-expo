/**
 * Renames the app, its bundle id and its package name, and resets the version.
 *
 *   pnpm rename <app-name> <bundle-id> [display-name]
 *   pnpm rename my-app com.acme.myapp
 *
 * Run it once, on a fresh clone, before the first commit of a new project.
 *
 * It touches an explicit list of files rather than sweeping the repository.
 * That is not caution for its own sake: `pnpm-lock.yaml` contains the package
 * `parse-imports-exports`, and a blind replace of the app name `s-expo` would
 * quietly corrupt it. Anything not on the list is left alone.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

export type Identity = {
  appName: string;
  displayName: string;
  bundleId: string;
};

export type Replacement = { from: RegExp; to: string; label: string };

/** Files the rename is allowed to touch, relative to the repository root. */
export const RENAMEABLE_FILES = [
  'package.json',
  'env.ts',
  'app.config.ts',
  'README.md',
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

export function validateAppName(appName: string): void {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(appName)) {
    throw new Error(
      `"${appName}" is not a usable app name. Use lower-case kebab-case, starting with a letter: my-app.`,
    );
  }
}

export function validateBundleId(bundleId: string): void {
  const segments = bundleId.split('.');

  if (segments.length < 2) {
    throw new Error(
      `"${bundleId}" needs at least two segments, like com.acme.myapp.`,
    );
  }

  for (const segment of segments) {
    if (!/^[a-z]\w*$/i.test(segment)) {
      throw new Error(
        `"${segment}" is not a valid segment of "${bundleId}". Android accepts only letters, digits and underscore, and every segment must start with a letter — a hyphen will not build.`,
      );
    }
  }
}

/** `my-app` becomes `MyApp`, which is what env.ts uses as the display name. */
export function deriveDisplayName(appName: string): string {
  return appName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Matches the token only when it is not glued to another word character.
 *
 * Without this, renaming `s-expo` also mangles `parse-imports-exports`, which
 * is a real package in the lockfile and would be a very confusing bug.
 *
 * Case-sensitive on purpose. `sexpo` — the editor's spelling dictionary — and
 * `SExpo` — the display name — differ only in case, and matching loosely makes
 * the first rule swallow the second.
 */
function boundedPattern(token: string): RegExp {
  return new RegExp(
    `(?<![a-zA-Z0-9-])${escapeRegExp(token)}(?![a-zA-Z0-9-])`,
    'g',
  );
}

/**
 * Longest and most specific first. The bundle id has to go before the app
 * name, or `com.sexpo.app` is rewritten piecemeal and ends up wrong.
 */
export function buildReplacements(current: Identity, next: Identity): Replacement[] {
  const compact = (name: string) => name.replace(/-/g, '');

  return [
    { from: boundedPattern(current.bundleId), to: next.bundleId, label: 'bundle id' },
    { from: boundedPattern(current.displayName), to: next.displayName, label: 'display name' },
    { from: boundedPattern(current.appName), to: next.appName, label: 'app name' },
    { from: boundedPattern(compact(current.appName)), to: compact(next.appName), label: 'app name, compact' },
  ];
}

export function applyReplacements(content: string, replacements: Replacement[]): string {
  return replacements.reduce(
    (result, { from, to }) => result.replace(from, to),
    content,
  );
}

/** Reads what the project is called today, so nothing has to be hardcoded. */
export function readCurrentIdentity(root: string): Identity {
  const packageJson = JSON.parse(
    readFileSync(path.join(root, 'package.json'), 'utf8'),
  ) as { name: string };

  const envSource = readFileSync(path.join(root, 'env.ts'), 'utf8');

  const displayName = envSource.match(/const NAME = '([^']+)'/)?.[1];
  const bundleId = envSource.match(/production: '([^']+)',\n\} as const;\n\nconst PACKAGES/)?.[1]
    ?? envSource.match(/const BUNDLE_IDS = \{[\s\S]*?production: '([^']+)'/)?.[1];

  if (!displayName || !bundleId) {
    throw new Error(
      'Could not read NAME or BUNDLE_IDS.production out of env.ts. Has its shape changed?',
    );
  }

  return { appName: packageJson.name, displayName, bundleId };
}

/** The version restarts at 0.0.1: a new app has not shipped anything yet. */
export function resetVersion(packageJsonSource: string): string {
  return packageJsonSource.replace(
    /("version":\s*)"[^"]+"/,
    '$1"0.0.1"',
  );
}

/**
 * Clears the previous owner's EAS project. Leaving it would point every build
 * at somebody else's Expo account, which fails late and confusingly.
 */
export function resetEasIdentity(appConfigSource: string): string {
  return appConfigSource
    .replace(/(const EXPO_ACCOUNT_OWNER = )'[^']*'/, '$1\'\'')
    .replace(/(const EAS_PROJECT_ID = )'[^']*'/, '$1\'\'');
}

export function resetRepositoryUrl(packageJsonSource: string, appName: string): string {
  return packageJsonSource.replace(
    /("url":\s*)"git\+https:\/\/github\.com\/[^"]+"/,
    `$1"git+https://github.com/OWNER/${appName}.git"`,
  );
}

export type FileChange = { file: string; changed: boolean; missing?: boolean };

export function rename(root: string, next: Identity): FileChange[] {
  const current = readCurrentIdentity(root);
  const replacements = buildReplacements(current, next);
  const changes: FileChange[] = [];

  for (const file of RENAMEABLE_FILES) {
    const absolute = path.join(root, file);
    let before: string;

    try {
      before = readFileSync(absolute, 'utf8');
    }
    catch {
      changes.push({ file, changed: false, missing: true });
      continue;
    }

    let after = applyReplacements(before, replacements);

    if (file === 'package.json') {
      after = resetRepositoryUrl(resetVersion(after), next.appName);
    }

    if (file === 'app.config.ts') {
      after = resetEasIdentity(after);
    }

    if (after !== before) {
      writeFileSync(absolute, after);
    }

    changes.push({ file, changed: after !== before });
  }

  return changes;
}

const WHAT_IS_LEFT = `
Still yours to do — none of it can be derived from a name:

  1. src/features/home/components/github-profile.tsx
     GITHUB_HANDLE still points at whoever this template came from.
     Change it, or delete the start screen along with its Maestro flows.

  2. npx eas-cli@latest login && npx eas-cli@latest init
     Then paste the project id into app.config.ts by hand. A dynamic config
     is read-only to the CLI, so it prints the id and stops.

  3. package.json — "repository" now says OWNER. Put yours in, and point
     'git remote set-url origin' at the same place.

     Check the README heading too. Anything decorative that spells the name
     differently is invisible to a rename.

  4. docs/guides/start-a-new-project.md carries the rest: the two places
     EXPO_PUBLIC_API_URL has to exist, the token permissions, the ruleset.
`;

export function main(root: string, argv: string[]): void {
  const [appName, bundleId, displayNameArgument] = argv;

  if (!appName || !bundleId) {
    console.error('Usage: pnpm rename <app-name> <bundle-id> [display-name]');
    console.error('   eg: pnpm rename my-app com.acme.myapp');
    process.exit(1);
  }

  validateAppName(appName);
  validateBundleId(bundleId);

  const next: Identity = {
    appName,
    bundleId,
    displayName: displayNameArgument ?? deriveDisplayName(appName),
  };

  const current = readCurrentIdentity(root);

  console.log(`  ${current.appName} -> ${next.appName}`);
  console.log(`  ${current.displayName} -> ${next.displayName}`);
  console.log(`  ${current.bundleId} -> ${next.bundleId}`);
  console.log('  version -> 0.0.1\n');

  const changes = rename(root, next);

  for (const { file, changed, missing } of changes) {
    const mark = missing ? 'absent ' : changed ? 'changed' : 'no-op  ';
    console.log(`  ${mark}  ${file}`);
  }

  console.log(WHAT_IS_LEFT);
  console.log('Run pnpm check-all before committing.\n');
}
