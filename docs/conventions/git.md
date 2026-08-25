# Git

## Branches

`main` is the only long-lived branch and always reflects what is releasable. Everything else is short-lived and starts from an up-to-date `main`:

```bash
git checkout main
git pull
git checkout -b feat/checkout-summary
```

| Prefix | For |
| --- | --- |
| `feat/` | new behaviour |
| `fix/` | a bug |
| `chore/` | dependencies, tooling, cleanup |
| `docs/` | documentation only |
| `refactor/` | behaviour unchanged |
| `test/` | tests only |
| `ci/` | pipeline only |

A Husky `pre-commit` hook checks the branch name, so a wrong prefix is rejected before the commit exists.

## Commits

Conventional Commits, enforced by commitlint on `commit-msg`:

```
<type>(<optional scope>): <subject in the imperative>
```

The subject says what changes, the body says **why**. What changed is already in the diff; the reasoning is the part that is lost otherwise, and it is what someone reads six months later while deciding whether they can undo your line.

## Pre-commit

`lint-staged` runs ESLint with `--fix` on staged files and then `tsc --noemit` on the project. Commits that would fail lint or type-check never land.

Never use `--no-verify` to get around a red hook. If the hook is wrong, fix the hook.

## Pull requests

Every change reaches `main` through a pull request. CI runs lint, type-check and the unit tests on each one — see [../ci/workflows.md](../ci/workflows.md).

Rebase onto `main` rather than merging it into your branch, so the history stays linear and each commit is a state the project was actually in.

## Rewriting history

Only ever on a branch nobody else has pulled, and never on `main`. Force-pushing a rewritten `main` breaks every open pull request that targets it — GitHub closes them outright when the base commit disappears.

If a secret is ever committed, rewriting history is not the fix on its own. Revoke the credential first: anyone who cloned before the rewrite still has it.
