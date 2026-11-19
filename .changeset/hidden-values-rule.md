---
'@formdef/core': patch
---

The warning about a step held back by fields it does not render now says that what a condition hides must accept every value it can hold. Being optional in the schema is not enough: a value typed before the condition hid the field is still validated.
