---
'@formdef/core': minor
---

`visibleWhen` and derived `props` take a second argument, `at`, with where the entry renders: its path and, inside an array, the item it belongs to. Inside an item, a change of the item runs them again, whatever `dependsOn` lists.
