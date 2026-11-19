---
'@formdef/core': minor
---

formdef now needs TypeScript 5.7 or later. TypeScript 5.4 to 5.6 leave `values` of a field's `visibleWhen` and derived `props` inside `createForm` implicitly `any`, so the earlier floor of 5.4 did not hold.
