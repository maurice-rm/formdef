<a href="https://formdef.mauricereim.de"><img src="https://formdef.mauricereim.de/brand/banner-light.png" alt="formdef. Describe a form once. Render it as a React component." width="100%" /></a>

# @formdef/core

Describe a form once as a typed object, render it as a React component — with the compiler
checking that every widget fits the value it receives. Built on
[TanStack Form](https://tanstack.com/form).

`createForm` comes from the registry that names your widgets, which
[Getting started](https://formdef.mauricereim.de/getting-started) sets up:

```tsx
export const SignIn = createForm({
  schema: z.object({ email: z.email(), remember: z.boolean() }),
  defaultValues: { email: '', remember: false },
  fields: {
    email: { widget: 'text', props: { label: 'Email' } },
    remember: { widget: 'checkbox', props: { label: 'Remember me' } },
  },
})
```

## Installation

```bash
npm install @formdef/core @tanstack/react-form zod
```

Zod stands for any schema library that implements [Standard Schema](https://standardschema.dev).
The widgets for shadcn/ui come from formdef's shadcn registry; the
[installation guide](https://formdef.mauricereim.de/installation) shows how to add it.

## Requirements

- React 19
- `@tanstack/react-form` `>=1.33.5 <1.34.0`
- TypeScript 5.4 or later
- Node 22 or later

## Documentation

[formdef.mauricereim.de](https://formdef.mauricereim.de), starting with
[Getting started](https://formdef.mauricereim.de/getting-started).

## License

[MIT](https://github.com/maurice-rm/formdef/blob/main/LICENSE)
