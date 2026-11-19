# Changesets

Every pull request that changes what `@formdef/core` ships, or what the shadcn registry
(`@formdef/shadcn`) hands out, adds a changeset:

```bash
pnpm changeset
```

It names the bump (patch, minor, major) and one line for the changelog. On `main`, the release
workflow collects the changesets into a "Version Packages" pull request; merging it publishes a new
`@formdef/core` after approval in the `npm` environment. `@formdef/shadcn` is private: it gets a
version and a changelog, but nothing is published to npm; the documentation site serves the
registry.
