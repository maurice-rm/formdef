# formdef example: Vite and shadcn/ui

A form built from one typed [formdef](https://formdef.mauricereim.de) config, with widgets from
formdef's shadcn registry, in a Vite app with shadcn/ui on Base UI.

[Open in StackBlitz](https://stackblitz.com/github/maurice-rm/formdef/tree/main/examples/vite)

## Run it

```bash
npm install
npm run dev
```

## Where things are

| Path | What it is |
| --- | --- |
| `src/project-form.tsx` | the config: schema, fields with their widgets, layout |
| `src/lib/formdef/index.tsx` | the registry that names the widgets |
| `src/components/formdef/` | formdef's widgets, fetched from its shadcn registry |
| `src/components/ui/` | the shadcn components the widgets use |

Point a field at a widget that serves another value, `notify` at `text` for instance, and the
config stops compiling.

## How it was made

```bash
npx shadcn@latest init --template vite --base base --preset nova
```

Then the `@formdef` registry went into `components.json`, as the
[installation guide](https://formdef.mauricereim.de/installation) describes, and the widgets came
from it:

```bash
npx shadcn@latest add @formdef/setup @formdef/text-field @formdef/select-field \
  @formdef/multi-combobox-field @formdef/date-field @formdef/checkbox-field \
  @formdef/section @formdef/submit-button
```
