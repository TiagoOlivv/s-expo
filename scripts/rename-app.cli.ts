/**
 * Entry point for `pnpm rename`. Kept apart from the module it calls so the
 * tests can import that one without executing anything.
 */

import process from 'node:process';

import { main } from './rename-app';

main(process.cwd(), process.argv.slice(2));
