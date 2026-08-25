// Expo generates expo-env.d.ts with this same reference, but that file is
// git-ignored, so it does not exist on a fresh clone or in CI. Without it
// TypeScript has no declaration for side-effect imports like `import
// '../global.css'`, and type-check fails everywhere except a machine that has
// already run the bundler. This committed file makes the reference reliable.
/// <reference types="expo/types" />
