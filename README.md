<div align="center">
  <a href="https://formdef.mauricereim.de">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://formdef.mauricereim.de/brand/banner-dark.png" />
      <source media="(prefers-color-scheme: light)" srcset="https://formdef.mauricereim.de/brand/banner-light.png" />
      <img src="https://formdef.mauricereim.de/brand/banner-light.png" alt="formdef. Describe a form once. Render it as a React component." width="100%" />
    </picture>
  </a>

  <p>
    <a href="https://www.npmjs.com/package/@formdef/core"><img src="https://img.shields.io/npm/v/@formdef/core?color=ff6900" alt="npm version" /></a>
    <a href="https://github.com/maurice-rm/formdef/actions/workflows/ci.yml"><img src="https://github.com/maurice-rm/formdef/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" /></a>
    <a href="https://scorecard.dev/viewer/?uri=github.com/maurice-rm/formdef"><img src="https://api.scorecard.dev/projects/github.com/maurice-rm/formdef/badge" alt="OpenSSF Scorecard" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/npm/l/@formdef/core" alt="MIT license" /></a>
  </p>

  <p>
    <a href="https://formdef.mauricereim.de">Documentation</a>
    ·
    <a href="https://formdef.mauricereim.de/getting-started">Getting started</a>
    ·
    <a href="https://formdef.mauricereim.de/widgets">Widgets</a>
    ·
    <a href="https://github.com/maurice-rm/formdef/releases">Releases</a>
  </p>
</div>

formdef turns a typed config into a form built on [TanStack Form](https://tanstack.com/form). You
write which field gets which widget, in which order; formdef renders it, and TanStack does the
rest: values, validation, arrays, submission.

`createForm` comes from the registry that names your widgets, which
[Getting started](https://formdef.mauricereim.de/getting-started) sets up:

```tsx
export const SignIn = createForm({
  schema: z.object({ email: z.email(), remember: z.boolean() }),
  defaultValues: { email: '', remember: false },
  fields: {
    email: { widget: 'text', props: { label: 'Email' } },
    remember: { widget: 'checkbox', props: { label: 'Remember me' } },
  },
})
```

`<SignIn />` renders a `<form>` with both fields, validates them with the schema and submits through
TanStack.

## Why formdef

- **Type-checked widgets.** A widget is checked against the value it receives. Point the checkbox,
  which serves a `boolean`, at the `string` field `email`, and the config does not compile. The same
  check covers the props a widget takes, the names a layout writes and the default values, all at
  compile time.
- **Built on TanStack Form.** Every option TanStack Form takes still reaches it, for the form and
  for each field. When a form outgrows one call, you take over the `<form>` element and keep the
  config; when formdef does not help, you write plain TanStack next to it.
- **Bring your own components.** A widget is a React component that receives the field as a prop.
  Write your own, or fetch ready ones for shadcn/ui from formdef's shadcn registry, as source you
  own.

## Installation

```bash
npm install @formdef/core @tanstack/react-form zod
```

Zod stands for any schema library that implements [Standard Schema](https://standardschema.dev).
For the widgets for shadcn/ui, add the registry to your `components.json` as the
[installation guide](https://formdef.mauricereim.de/installation) shows, then:

```bash
npx shadcn@latest add @formdef/setup @formdef/text-field
```

formdef needs React 19, TypeScript 5.4 or later with `strict` on, and `@tanstack/react-form` from
1.33.5 below 1.34. [Getting started](https://formdef.mauricereim.de/getting-started) builds a
first form step by step.

## Contributing

The [contributing guide](https://formdef.mauricereim.de/contributing) describes how the repository
is set up, how code is written in it and how a change reaches a release. Report a vulnerability as
[SECURITY.md](SECURITY.md) describes, never in a public issue. Everyone taking part follows the
[Code of Conduct](CODE_OF_CONDUCT.md).

### Repository

```
packages/core            @formdef/core — the library, published to npm
packages/shadcn          the widgets, built as a shadcn registry into apps/docs/public/r (private)
packages/integration     uses the built @formdef/core as a consumer would (private)
packages/tsconfig        the shared TypeScript configuration (private)
apps/docs                the documentation, built with Fumadocs (private)
```

### Prerequisites

- Node 24 (`.nvmrc`; `nvm use` picks it up). The library itself supports Node 22 and up.
- pnpm 12, through the `packageManager` field (`corepack enable`).

### Commands

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
pnpm --filter @formdef/docs preview:images   # its images, from the running documentation
pnpm changeset        # describe a change to a published package
```

## License

[MIT](LICENSE)
