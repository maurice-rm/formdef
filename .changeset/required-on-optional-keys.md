---
'@formdef/core': patch
---

`props.required` takes `true` on a key the schema makes optional, so a field required only under a condition can be marked, also one whose widget's empty value is `undefined`. It was a type error before.
