# Changesets

Every pull request that changes what `@formdef/core` or `@formdef/document` ships, or what the
shadcn registry (`@formdef/shadcn`) hands out, adds a changeset:

```bash
pnpm changeset
```

It names the bump (patch, minor, major) and one line for the changelog. On `main`, the release
workflow collects the changesets into a "Version Packages" pull request; merging it publishes the
new versions of `@formdef/core` and `@formdef/document` after approval in the `npm` environment. `@formdef/shadcn` is private: it gets a
version and a changelog, but nothing is published to npm; the documentation site serves the
registry.
