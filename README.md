# formdef

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/maurice-rm/formdef/badge)](https://scorecard.dev/viewer/?uri=github.com/maurice-rm/formdef)

Describe a form once as a typed object, render it as a React component — with the compiler
checking that every widget fits the value it receives.

formdef is built on [TanStack Form](https://tanstack.com/form). It is working towards its first
release.

## Repository

```
packages/core            @formdef/core — the library, published to npm
packages/shadcn          the widgets, built as a shadcn registry into apps/docs/public/r (private)
packages/integration     uses the built @formdef/core as a consumer would (private)
packages/tsconfig        the shared TypeScript configuration (private)
apps/docs                the documentation, built with Fumadocs (private)
```

## Prerequisites

- Node 24 (`.nvmrc`; `nvm use` picks it up). The library itself supports Node 22 and up.
- pnpm 12, through the `packageManager` field (`corepack enable`).

## Commands

```bash
pnpm install          # install, and set up the pre-commit hook
pnpm lint             # format and lint with Biome (read-only)
pnpm lint:fix         # format and lint with Biome, writing fixes
pnpm knip             # unused files, exports and dependencies
pnpm boundaries       # package boundaries
pnpm check-types      # TypeScript across all packages
pnpm test             # runtime tests
pnpm test:types       # type tests
pnpm build            # build all packages
pnpm --filter @formdef/docs dev   # the documentation at http://localhost:3010
pnpm changeset        # describe a change to a published package
```

## License

[MIT](LICENSE)
