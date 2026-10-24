# AGENTS.md

How to work in this repository, for people and for agents. The documentation in `apps/docs`
says what formdef does; this file says how code is written here.

## Scope

- A change does what it set out to do and nothing else. An improvement noticed on the way is
  reported to the maintainer — never folded in.
- The public API, the shape of a form config and the vocabulary are decided by the maintainer. A
  change or a review finding that would alter one of them is raised as a question, not made.
- This repository holds code, its documentation and contributor guidance only. Planning
  documents are kept elsewhere, and nothing here links to them.

## Before writing code

- Read the official documentation of the version installed here, not memory: the package's own
  docs (Turborepo ships them in `node_modules/turbo/docs`), the `.d.ts` in `node_modules`, or
  the official site. Name the source when a choice is not obvious.
- Where a choice has alternatives, check how well-regarded projects solve it.
- A new dependency needs the maintainer's approval. Install only versions older than one day
  (`minimumReleaseAge`); never add an exclusion to get around it.

## Code

- **Public exports carry complete TSDoc:** a summary; `@typeParam` for every type parameter;
  `@param name -` and `@returns` where they say more than the type; `@throws` for every error
  raised on purpose; at least one `@example` per entry point; a comment on every member of a
  props or options interface; `@defaultValue` on optional options. No types inside `@param`.
- **Internal code** gets a doc comment only where name and signature do not say enough. An inline
  comment is reserved for a workaround (with a link), a non-obvious constraint, or a dense
  algorithm. Design history and rationale stay out of TSDoc — TSDoc ships in `dist`.
- **One word per concept,** as the glossary of the documentation defines it — in code, error
  messages and documentation alike.
- **A rule exists once.** Before writing something that resembles existing code, find the
  existing code. Similar code is named and compared the second time and merged the third time;
  a domain rule never gets a second copy.
- **Consistency across modules:** errors are `Error` with a `formdef:` prefix and the path
  concerned; constants and types sit at the top of a file; one exported concept per file; file
  names are kebab-case and match what they export.
- At most three parameters, otherwise an options object; guard clauses over nesting; named
  constants over magic values; functions either do or answer. Biome enforces what it can
  (`useMaxParams`, `noExcessiveCognitiveComplexity`, `useNamingConvention`, `noImportCycles`).
- **Imports inside a package are relative, `../` included.** No path aliases and no `#/` subpath
  imports in packages: TypeScript does not rewrite aliases in emitted declarations. Module
  boundaries inside a package are enforced with `noRestrictedImports` overrides per folder,
  added in `biome.json` together with the folders they guard.
- Exports of `@formdef/core` declare their types (`isolatedDeclarations`).

## Tests

- A new test fails before the code that makes it pass, and the report says how it was seen red.
- Tests sit next to the file they test: `x.test.ts` for runtime, `x.test-d.ts` for types.
  **Exception:** `packages/shadcn` keeps its tests in `tests/`, because its source files are
  copied into users' projects and a test beside them would travel along.
- A negative type test uses a fixture that is valid except for the one error under test.

## Verify

Green before a change counts as done:

```bash
pnpm lint && pnpm knip && pnpm boundaries && pnpm turbo check-types test test:types build
```

After a change touching more than one file, run an independent review against this file.

## Keep text current

A change that makes a text wrong updates it in the same change.

| File                         | Goes stale when                                         |
| ---------------------------- | ------------------------------------------------------- |
| `README.md`                  | packages, prerequisites or commands change              |
| `AGENTS.md`                  | a convention or the verify command changes              |
| TSDoc of an export           | the behaviour it describes changes — it ships in `dist` |
| documentation in `apps/docs` | anything a user reads there changes                     |
| error messages               | the condition they report changes                       |

## Git

- Conventional Commits: `type(scope): description`, imperative, lower case, no trailing period,
  under ~72 characters. Subject only by default; a body only for a reason the diff cannot show.
- One concern per commit; refactoring apart from behaviour changes.
- `main` is the only long-lived branch; work happens in short-lived branches merged by squash.
  Releases go through the Changesets version pull request.
- Nothing in code, comments, commit messages or documentation refers to planning documents
  outside this repository.
