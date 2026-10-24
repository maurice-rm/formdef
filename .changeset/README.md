# Changesets

Every pull request that changes what `@formdef/core` ships adds a changeset:

```bash
pnpm changeset
```

It names the bump (patch, minor, major) and one line for the changelog. On `main`, the release
workflow collects the changesets into a "Version Packages" pull request; merging it publishes the
new version after approval in the `npm` environment.
