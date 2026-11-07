---
'@formdef/core': minor
---

`createForm` finds the fields the schema requires by validating it once with each widget's empty value, and passes `required` to every widget that declares a static `emptyValue`. A `required` in `props` wins.
