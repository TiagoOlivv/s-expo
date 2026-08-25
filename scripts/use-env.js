#!/usr/bin/env node
// Copies one of the .env.<name>.example files onto .env.local, which Expo loads
// with precedence over .env and which is git-ignored.
//
//   pnpm env:use development | preview | production

const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');

const ENVIRONMENTS = ['development', 'preview', 'production'];
const root = path.resolve(__dirname, '..');

const requested = process.argv[2];

if (!ENVIRONMENTS.includes(requested)) {
  console.error(
    `Usage: pnpm env:use <${ENVIRONMENTS.join('|')}>\n`
    + `${requested ? `Unknown environment "${requested}".` : 'No environment given.'}`,
  );
  process.exit(1);
}

const source = path.join(root, `.env.${requested}.example`);
const target = path.join(root, '.env.local');

if (!fs.existsSync(source)) {
  console.error(`Missing ${path.basename(source)}.`);
  process.exit(1);
}

fs.copyFileSync(source, target);
console.log(
  `.env.local now holds the ${requested} values.\n`
  + 'Restart Metro with `pnpm start --clear` to pick them up.',
);
