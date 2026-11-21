<a href="https://formdef.mauricereim.de"><img src="https://formdef.mauricereim.de/brand/banner-light.png" alt="formdef. Describe a form once. Render it as a React component." width="100%" /></a>

# @formdef/document

Describe a form as data, a **form document**, and turn it into a formdef form at runtime. For form
builders, and for forms that are stored in a database and change without a deploy.

The typed config of [`@formdef/core`](https://www.npmjs.com/package/@formdef/core) stays the way
to write a form in code. A form document is the way to store one: JSON with a format version,
checked before it is used, and rendered through the widgets of your registry.

```tsx
import { createValidator, readDocument } from '@formdef/document'
import { createDocumentForm } from '@formdef/document/react'

import { catalog } from '@/lib/formdef/catalog'

const document = readDocument(await loadForm(id))
const ChecklistForm = createDocumentForm(document, catalog)

// On the server, the same document and catalog check the answers.
const result = createValidator(document, catalog)['~standard'].validate(answers)
```

## Installation

```bash
npm install @formdef/document @formdef/core @tanstack/react-form
```

A catalog of kinds for the shadcn/ui widgets comes from formdef's shadcn registry:
`npx shadcn add @formdef/catalog`, after the setup the
[installation guide](https://formdef.mauricereim.de/installation) describes.

## Requirements

- React 19
- `@formdef/core` in the minor version this release was built with, as its peer range names it
- TypeScript 5.7 or later
- Node 22 or later

## Documentation

[formdef.mauricereim.de/documents](https://formdef.mauricereim.de/documents).

## License

[MIT](https://github.com/maurice-rm/formdef/blob/main/LICENSE)
