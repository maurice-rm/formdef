---
'@formdef/shadcn': patch
---

pr: 117

Every registry item names the lowest `@formdef/core` its files need, so `shadcn add` no longer installs an older core than they import (#106).
