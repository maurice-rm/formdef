---
'@formdef/core': patch
---

`dependsOn` narrows when a condition or derived props read again inside an array item too; before, an entry there read again on every render of its item.
