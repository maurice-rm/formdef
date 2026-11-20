# @formdef/document

Describe a form as data, a **form document**, and turn it into a formdef form at runtime. For form
builders, and for forms that are stored in a database and change without a deploy.

The typed config of [`@formdef/core`](https://www.npmjs.com/package/@formdef/core) stays the way
to write a form in code. A form document is the way to store one: JSON with a format version,
checked before it is used, and rendered through the widgets of your registry.

```sh
npm install @formdef/document @formdef/core @tanstack/react-form
```

```tsx
import { createValidator, readDocument } from '@formdef/document'
import { createDocumentForm } from '@formdef/document/react'

import { fieldKinds } from '@/lib/formdef/field-kinds'

const document = readDocument(await loadForm(id))
const ChecklistForm = createDocumentForm(document, fieldKinds)

// On the server, the same document and field kinds check the answers.
const result = createValidator(document, fieldKinds)['~standard'].validate(answers)
```

The shadcn registry ships field kinds for its widgets: `npx shadcn add @formdef/field-kinds`. The
guide is at [formdef.mauricereim.de/docs/documents](https://formdef.mauricereim.de/docs/documents).

## License

MIT
