import {
  applyReplacements,
  buildReplacements,
  deriveDisplayName,
  resetEasIdentity,
  resetRepositoryUrl,
  resetVersion,
  validateAppName,
  validateBundleId,
} from './rename-app';

const CURRENT = {
  appName: 's-expo',
  displayName: 'SExpo',
  bundleId: 'com.sexpo.app',
};

const NEXT = {
  appName: 'my-app',
  displayName: 'MyApp',
  bundleId: 'com.acme.myapp',
};

const replacements = () => buildReplacements(CURRENT, NEXT);

describe('validateAppName', () => {
  it.each(['my-app', 'app', 'a1', 'one-two-three'])('accepts %s', (name) => {
    expect(() => validateAppName(name)).not.toThrow();
  });

  it.each(['My-App', '-app', 'app-', 'my_app', '1app', 'my app', ''])(
    'rejects %s',
    (name) => {
      expect(() => validateAppName(name)).toThrow(/kebab-case/);
    },
  );
});

describe('validateBundleId', () => {
  it.each(['com.acme.myapp', 'com.acme', 'dev.tiago.some_app'])(
    'accepts %s',
    (id) => {
      expect(() => validateBundleId(id)).not.toThrow();
    },
  );

  it('rejects a single segment', () => {
    expect(() => validateBundleId('myapp')).toThrow(/two segments/);
  });

  // The rule that actually bites: Android refuses a hyphen, and the failure
  // arrives from Gradle rather than from anything readable.
  it('rejects a hyphen and says why', () => {
    expect(() => validateBundleId('com.my-app.thing')).toThrow(/hyphen will not build/);
  });

  it('rejects a segment starting with a digit', () => {
    expect(() => validateBundleId('com.1acme.app')).toThrow(/valid segment/);
  });
});

describe('deriveDisplayName', () => {
  it.each([
    ['my-app', 'MyApp'],
    ['s-expo', 'SExpo'],
    ['app', 'App'],
    ['one-two-three', 'OneTwoThree'],
  ])('%s becomes %s', (input, expected) => {
    expect(deriveDisplayName(input)).toBe(expected);
  });
});

describe('applyReplacements', () => {
  it('rewrites the bundle id and every variant built on it', () => {
    const source = [
      'production: \'com.sexpo.app\',',
      'preview: \'com.sexpo.app.preview\',',
      'development: \'com.sexpo.app.development\',',
    ].join('\n');

    expect(applyReplacements(source, replacements())).toBe(
      [
        'production: \'com.acme.myapp\',',
        'preview: \'com.acme.myapp.preview\',',
        'development: \'com.acme.myapp.development\',',
      ].join('\n'),
    );
  });

  it('rewrites the display name, the app name and the compact form', () => {
    const source = 'const NAME = \'SExpo\'; slug: \'s-expo\'; cSpell: "sexpo"';

    expect(applyReplacements(source, replacements())).toBe(
      'const NAME = \'MyApp\'; slug: \'my-app\'; cSpell: "myapp"',
    );
  });

  // The reason this script uses an explicit file list and bounded patterns.
  // `parse-imports-exports` is a real package in pnpm-lock.yaml, and it
  // contains the exact sequence `s-expo`. A naive replace corrupts the lockfile
  // and the failure surfaces nowhere near the rename.
  it('leaves a word that merely contains the app name alone', () => {
    const source = 'parse-imports-exports@0.2.4:\n  resolution: {integrity: sha512}';

    expect(applyReplacements(source, replacements())).toBe(source);
  });

  it('does not touch a longer name that starts with the app name', () => {
    expect(applyReplacements('s-expofoo', replacements())).toBe('s-expofoo');
  });

  it('is a no-op on content that never mentions the project', () => {
    const source = 'export function add(a: number, b: number) { return a + b; }';

    expect(applyReplacements(source, replacements())).toBe(source);
  });
});

describe('resetVersion', () => {
  it('takes the version back to 0.0.1', () => {
    expect(resetVersion('{\n  "version": "1.4.2",\n}')).toContain('"version": "0.0.1"');
  });

  it('leaves other versions in the file alone', () => {
    const source = '{\n  "version": "1.4.2",\n  "packageManager": "pnpm@10.12.3"\n}';

    expect(resetVersion(source)).toContain('"packageManager": "pnpm@10.12.3"');
  });
});

describe('resetEasIdentity', () => {
  it('clears both EAS fields so no build lands in the previous account', () => {
    const source = [
      'const EXPO_ACCOUNT_OWNER = \'tiagoolivv\';',
      'const EAS_PROJECT_ID = \'c3d0d792-caec-4006-bea2-8d3da1d416c8\';',
    ].join('\n');

    expect(resetEasIdentity(source)).toBe(
      ['const EXPO_ACCOUNT_OWNER = \'\';', 'const EAS_PROJECT_ID = \'\';'].join('\n'),
    );
  });
});

describe('resetRepositoryUrl', () => {
  it('replaces the previous repository with a placeholder', () => {
    const source = '"url": "git+https://github.com/TiagoOlivv/s-expo.git"';

    expect(resetRepositoryUrl(source, 'my-app')).toBe(
      '"url": "git+https://github.com/OWNER/my-app.git"',
    );
  });
});
