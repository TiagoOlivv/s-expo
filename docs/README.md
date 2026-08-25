# Documentation

How this template is put together and the rules that keep it that way. Everything here describes the code as it stands, not an aspiration.

## Start here

**[workflow.md](./workflow.md) is the spine** — how a change goes from an idea to a merge, whatever its type. Read it before your first commit.

| If you want to | Read |
| --- | --- |
| Know how to work in this repo | [workflow.md](./workflow.md) |
| Understand how the pieces fit | [architecture/overview.md](./architecture/overview.md) |
| Know where a file belongs | [architecture/project-structure.md](./architecture/project-structure.md) |
| Add your first feature | [guides/add-a-feature.md](./guides/add-a-feature.md) |
| Run against a different API | [guides/environment.md](./guides/environment.md) |
| Write a test | [testing/unit.md](./testing/unit.md) |
| Change colours or the theme | [design-system/theming.md](./design-system/theming.md) |
| Understand a CI failure | [ci/workflows.md](./ci/workflows.md) |
| Move to the next Expo SDK | [guides/upgrading-sdk.md](./guides/upgrading-sdk.md) |
| Set up your editor | [the README](../README.md#editor) |

## Contents

- **[workflow.md](./workflow.md)** — the development loop, from classifying a change to merging it
- **architecture/** — [overview](./architecture/overview.md), [project structure](./architecture/project-structure.md), [data flow](./architecture/data-flow.md)
- **conventions/** — [naming](./conventions/naming.md), [imports](./conventions/imports.md), [typescript](./conventions/typescript.md), [git](./conventions/git.md)
- **design-system/** — [theming](./design-system/theming.md), [components](./design-system/components.md)
- **testing/** — [unit](./testing/unit.md), [end to end](./testing/e2e.md)
- **ci/** — [workflows](./ci/workflows.md)
- **guides/** — [add a feature](./guides/add-a-feature.md), [environment](./guides/environment.md), [upgrading the SDK](./guides/upgrading-sdk.md)
- **reference/** — [removed patterns](./reference/removed-patterns.md), working code for conventions this template no longer exercises

## The short version

Four rules carry most of the weight:

1. Imports flow one way: `app/ → features/ → components/ui/ → lib/`.
2. A route file is a one-line re-export. Logic lives in the feature.
3. No barrel exports inside a feature.
4. Write the failing test first.
