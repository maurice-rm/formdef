---
'@formdef/core': patch
---

When the first invalid field is a radio or checkbox group, whose field id sits on a group that takes no focus, its first option takes the focus after a failed step or submit; before, the focus stayed where it was.
