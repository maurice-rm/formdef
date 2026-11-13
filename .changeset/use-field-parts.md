---
'@formdef/core': minor
---

`useFieldParts` wires a widget's control like `fieldParts` and subscribes to the submit, so a field that was left before without an edit shows its error after a submit. `fieldParts` reads the submit without subscribing to it and is deprecated.
