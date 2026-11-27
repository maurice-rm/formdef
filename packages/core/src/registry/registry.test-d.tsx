import type { ComponentType, ReactNode } from 'react'
import { describe, expectTypeOf, it } from 'vitest'
import { z } from 'zod'

import type { RowProps, SectionProps, StepperProps } from '../config/structure'
import type { FieldOf } from '../widget/field-of'
import { createRegistry } from './create-registry'
import type { FieldsOf } from './fields-of'
import type { LayoutOf } from './layout-of'
import type { Registry } from './registry'

declare const TextField: ComponentType<FieldOf<string> & { label: string }>
declare const NumberField: ComponentType<FieldOf<number> & { label: string }>
declare const DateField: ComponentType<FieldOf<Date> & { label: string }>
declare const SubmitButton: ComponentType<{ label: string }>
declare const AreaField: ComponentType<FieldOf<string> & { label: string; rows?: number }>
declare const ResetButton: ComponentType<{ label: string; confirm?: boolean }>

describe('Registry', () => {
  it('carries the widgets, form components and structure slots it was created with', () => {
    const Section = ({ label, children }: SectionProps & { description?: string }): ReactNode => (
      <fieldset aria-label={label}>{children}</fieldset>
    )
    const registry = createRegistry({
      widgets: { text: TextField },
      formComponents: { SubmitButton },
      structure: { section: Section },
    })

    expectTypeOf(registry).toEqualTypeOf<
      Registry<
        { readonly text: typeof TextField },
        { readonly SubmitButton: typeof SubmitButton },
        { readonly section: typeof Section }
      >
    >()
  })

  it('keeps its types through extensions, one after another', () => {
    const base = createRegistry({ widgets: { text: TextField } })
    const extended = base
      .extendRegistry({ widgets: { number: NumberField } })
      .extendRegistry({ formComponents: { SubmitButton } })
      .extendRegistry({ widgets: { date: DateField } })

    expectTypeOf(extended).not.toBeAny()
    expectTypeOf(extended).toExtend<
      Registry<
        { text: typeof TextField; number: typeof NumberField; date: typeof DateField },
        { SubmitButton: typeof SubmitButton },
        Record<never, never>
      >
    >()
  })

  it('rejects an extension that names a widget the registry already has', () => {
    const base = createRegistry({ widgets: { text: TextField } })

    // @ts-expect-error a widget named `text` is already registered
    base.extendRegistry({ widgets: { text: NumberField } })
  })

  it('rejects an extension that names a form component the registry already has', () => {
    const base = createRegistry({
      widgets: { text: TextField },
      formComponents: { SubmitButton },
    })

    // @ts-expect-error a form component named `SubmitButton` is already registered
    base.extendRegistry({ formComponents: { SubmitButton } })
  })

  it("takes a widget's empty value of the value type it serves", () => {
    const NameField = (_: FieldOf<string> & { label: string }): ReactNode => null
    NameField.emptyValue = ''
    const AgeField = (_: FieldOf<number | undefined>): ReactNode => null
    AgeField.emptyValue = undefined

    const registry = createRegistry({
      widgets: { name: NameField },
    }).extendRegistry({ widgets: { age: AgeField } })
    expectTypeOf(registry).not.toBeAny()
  })

  it('rejects an empty value that is no value of the widget', () => {
    const NameField = (_: FieldOf<string> & { label: string }): ReactNode => null
    NameField.emptyValue = undefined
    const AgeField = (_: FieldOf<number>): ReactNode => null
    AgeField.emptyValue = ''

    // @ts-expect-error a text widget's empty value is a string
    createRegistry({ widgets: { name: NameField } })
    const base = createRegistry({ widgets: { text: TextField } })
    // @ts-expect-error a number widget's empty value is a number
    base.extendRegistry({ widgets: { age: AgeField } })
  })

  it('checks an empty value a widget declares as optional', () => {
    const DeclaredField = TextField as typeof TextField & { emptyValue?: string }
    const WrongField = TextField as typeof TextField & { emptyValue?: number }

    createRegistry({ widgets: { text: DeclaredField } })
    // @ts-expect-error a text widget's empty value is a string
    createRegistry({ widgets: { text: WrongField } })
  })

  it("hands out TanStack's form hook", () => {
    const { formHook } = createRegistry({ widgets: { text: TextField } })

    expectTypeOf(formHook).toHaveProperty('useAppForm')
    expectTypeOf(formHook).toHaveProperty('appFormOptions')
    expectTypeOf(formHook).toHaveProperty('defineAppFieldGroup')
  })

  it('rejects a section slot that takes its label as something other than a string', () => {
    const NumberedSection = ({
      label,
      children,
    }: {
      label: number
      children: ReactNode
    }): ReactNode => <fieldset aria-label={String(label)}>{children}</fieldset>

    createRegistry({
      widgets: { text: TextField },
      // @ts-expect-error the renderer passes the section title as a string
      structure: { section: NumberedSection },
    })
  })

  it('takes slots with props of their own on top of the renderer’s', () => {
    const Row = ({ children, gap }: RowProps & { gap: 'small' | 'large' }): ReactNode => (
      <div data-gap={gap}>{children}</div>
    )

    const registry = createRegistry({
      widgets: { text: TextField },
      structure: { row: Row },
    })
    expectTypeOf(registry).not.toBeAny()
  })

  it('takes a stepper slot with props of its own on top of the renderer’s', () => {
    const Stepper = ({ children, nextLabel }: StepperProps & { nextLabel?: string }): ReactNode => (
      <section aria-label={nextLabel}>{children}</section>
    )

    const registry = createRegistry({
      widgets: { text: TextField },
      structure: { stepper: Stepper },
    })
    expectTypeOf(registry).not.toBeAny()
  })

  it('rejects a stepper slot that takes the current step as something other than a number', () => {
    const NamedStepper = ({ children }: { current: string; children: ReactNode }): ReactNode => (
      <section>{children}</section>
    )

    createRegistry({
      widgets: { text: TextField },
      // @ts-expect-error the renderer passes the index of the current step
      structure: { stepper: NamedStepper },
    })
  })
})

describe('Registry.createForm with steps', () => {
  const Stepper = ({ children }: StepperProps): ReactNode => <section>{children}</section>
  const registry = createRegistry({
    widgets: { text: TextField, number: NumberField },
    formComponents: { SubmitButton },
    structure: { stepper: Stepper },
  })
  const schema = z.object({
    contact: z.object({ name: z.string() }),
    building: z.object({ rooms: z.number() }),
    notes: z.string(),
  })
  type Checklist = z.input<typeof schema>
  const defaultValues = { contact: { name: '' }, building: { rooms: 0 }, notes: '' }
  const fields = {
    contact: { fields: { name: { widget: 'text', props: { label: 'Name' } } } },
    building: { fields: { rooms: { widget: 'number', props: { label: 'Rooms' } } } },
  } as const

  it('renders the root level as steps, each an object key with a label', () => {
    const Checklist = registry.createForm({
      schema,
      defaultValues,
      fields,
      layout: [
        { step: 'contact', label: 'Contact' },
        {
          step: 'building',
          label: 'Building',
          visibleWhen: (values) => {
            expectTypeOf(values).toEqualTypeOf<Checklist>()
            return values.contact.name !== ''
          },
        },
      ],
    })
    expectTypeOf(Checklist).not.toBeAny()
  })

  it('arranges each step by the layout of its level', () => {
    const Checklist = registry.createForm({
      schema,
      defaultValues,
      fields: {
        contact: {
          fields: { name: { widget: 'text', props: { label: 'Name' } } },
          layout: [{ section: 'Who', layout: ['name'] }, { render: () => null }],
        },
      },
      layout: [{ step: 'contact', label: 'Contact' }],
    })
    expectTypeOf(Checklist).not.toBeAny()
  })

  it('rejects a root layout that mixes steps with other entries', () => {
    registry.createForm({
      schema,
      defaultValues,
      fields,
      // @ts-expect-error a root layout that holds a step holds only steps
      layout: [{ step: 'contact', label: 'Contact' }, 'building'],
    })
  })

  it('rejects a step on a key that is not an object', () => {
    registry.createForm({
      schema,
      defaultValues,
      fields: { ...fields, notes: { widget: 'text', props: { label: 'Notes' } } },
      // @ts-expect-error `notes` holds a string, a step renders an object level
      layout: [{ step: 'notes', label: 'Notes' }],
    })
  })

  it('rejects a step on a key described by a widget or a render', () => {
    registry.createForm({
      schema,
      defaultValues,
      fields: { ...fields, contact: { render: () => null } },
      // @ts-expect-error a step renders the fields of the entry it names
      layout: [{ step: 'contact', label: 'Contact' }],
    })
  })

  it('rejects a step on a key fields does not describe', () => {
    registry.createForm({
      schema,
      defaultValues,
      fields: { contact: fields.contact },
      // @ts-expect-error `building` is not described in fields
      layout: [
        { step: 'contact', label: 'Contact' },
        { step: 'building', label: 'Building' },
      ],
    })
  })

  it('rejects a step inside the layout of a level', () => {
    registry.createForm({
      schema,
      defaultValues,
      fields: {
        contact: {
          fields: { name: { widget: 'text', props: { label: 'Name' } } },
          // @ts-expect-error a step is an entry of the root layout only
          layout: [{ step: 'name', label: 'Name' }],
        },
      },
    })
  })

  it('rejects an unknown key on a step', () => {
    registry.createForm({
      schema,
      defaultValues,
      fields,
      // @ts-expect-error `title` is not a key of a step
      layout: [{ step: 'contact', label: 'Contact', title: 'Contact' }],
    })
  })

  it('rejects steps without a registered stepper', () => {
    const bare = createRegistry({ widgets: { text: TextField } })
    bare.createForm({
      schema: z.object({ contact: z.object({ name: z.string() }) }),
      defaultValues: { contact: { name: '' } },
      fields: { contact: { fields: { name: { widget: 'text', props: { label: 'Name' } } } } },
      // @ts-expect-error a step needs a registered stepper
      layout: [{ step: 'contact', label: 'Contact' }],
    })
  })

  it('types the props of a step after the registered stepper', () => {
    const DescribedStepper = ({
      steps,
      children,
    }: StepperProps<{ description?: string; icon: ReactNode }>): ReactNode => (
      <section aria-description={steps[0]?.description}>{children}</section>
    )
    const described = createRegistry({
      widgets: { text: TextField, number: NumberField },
      structure: { stepper: DescribedStepper },
    })

    const Checklist = described.createForm({
      schema,
      defaultValues,
      fields,
      layout: [
        {
          step: 'contact',
          label: 'Contact',
          props: { icon: null, description: 'How we reach you' },
        },
        {
          step: 'building',
          label: 'Building',
          props: (values) => ({ icon: null, description: values.contact.name }),
        },
      ],
    })
    expectTypeOf(Checklist).not.toBeAny()

    described.createForm({
      schema,
      defaultValues,
      fields,
      // @ts-expect-error the stepper needs an icon for each step
      layout: [
        { step: 'contact', label: 'Contact' },
        { step: 'building', label: 'Building', props: { icon: null } },
      ],
    })
  })

  it('renders no steps under Fields', () => {
    const Shell = (): ReactNode => {
      const form = registry.formHook.useAppForm({ defaultValues })

      return (
        <registry.Fields
          form={form}
          fields={fields}
          // @ts-expect-error only createForm renders steps
          layout={[{ step: 'contact', label: 'Contact' }]}
        />
      )
    }
    expectTypeOf(Shell).not.toBeAny()
  })
})

describe('Registry.createForm', () => {
  const registry = createRegistry({
    widgets: { text: TextField, area: AreaField, number: NumberField },
    formComponents: { SubmitButton, ResetButton },
  })
  const schema = z.object({ email: z.email(), age: z.number() })
  type Signup = z.input<typeof schema>

  it('types the callbacks of a config by its schema', () => {
    const Signup = registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      fields: {
        email: {
          widget: 'text',
          props: { label: 'Email' },
          visibleWhen: (values) => {
            expectTypeOf(values).toEqualTypeOf<Signup>()
            return true
          },
        },
        age: { widget: 'number', props: { label: 'Age' } },
      },
      onSubmit: ({ value }) => {
        expectTypeOf(value).toEqualTypeOf<Signup>()
      },
    })
    expectTypeOf(Signup).not.toBeAny()
  })

  it('takes a server error from a validator on submit', () => {
    const Signup = registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      fields: {},
      validators: [
        { run: async () => ({ form: 'Taken', fields: { email: 'Taken' } }), triggers: [] },
      ],
    })
    expectTypeOf(Signup).not.toBeAny()
  })

  it('needs no props when the config holds the default values', () => {
    const Signup = registry.createForm({ schema, defaultValues: { email: '', age: 0 }, fields: {} })

    expectTypeOf<Record<never, never>>().toExtend<Parameters<typeof Signup>[0]>()
  })

  it('needs the default values in options when the config leaves them out', () => {
    const Signup = registry.createForm({ schema, fields: {} })

    expectTypeOf<Record<never, never>>().not.toExtend<Parameters<typeof Signup>[0]>()
    expectTypeOf<{ options: { defaultValues: Signup } }>().toExtend<Parameters<typeof Signup>[0]>()
  })

  it('rejects a widget that does not fit its value', () => {
    registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      // @ts-expect-error a number widget does not serve the email
      fields: { email: { widget: 'number', props: { label: 'Email' } } },
    })
  })

  it('rejects fields that are no object', () => {
    registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      // @ts-expect-error fields describes the keys of the schema
      fields: 42,
    })
  })

  it('rejects a layout naming a key fields does not describe, also in sections and rows', () => {
    registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      fields: { email: { widget: 'text', props: { label: 'Email' } } },
      // @ts-expect-error age is not described in fields
      layout: ['email', 'age'],
    })
    registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      fields: { email: { widget: 'text', props: { label: 'Email' } } },
      // @ts-expect-error age is not described in fields
      layout: [{ section: 'About you', layout: [{ row: ['email', 'age'] }] }],
    })
  })

  it('rejects a prop the widget does not take and a key no config has', () => {
    registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      // @ts-expect-error the text widget takes no colour
      fields: { email: { widget: 'text', props: { label: 'Email', colour: 'red' } } },
    })
    registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      fields: {},
      // @ts-expect-error a config has no colour
      colour: 'red',
    })
  })

  it('checks props against the widget or form component an entry names, not its siblings', () => {
    registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      // @ts-expect-error rows belongs to the area widget, not to text
      fields: { email: { widget: 'text', props: { label: 'Email', rows: 3 } } },
    })
    registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      fields: { email: { widget: 'area', props: { label: 'Email', rows: 3 } } },
      layout: [
        'email',
        // @ts-expect-error confirm belongs to the reset button, not to submit
        { component: 'SubmitButton', props: { label: 'Sign up', confirm: true } },
      ],
    })
  })

  it('rejects a key that belongs to another kind of layout entry', () => {
    registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      fields: { email: { widget: 'text', props: { label: 'Email' } } },
      // @ts-expect-error a row has no layout of its own
      layout: [{ row: ['email'], layout: ['email'] }],
    })
  })

  it('types the form handle an inline entry of its layout receives', () => {
    const Signup = registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      fields: { email: { widget: 'text', props: { label: 'Email' } } },
      layout: [
        'email',
        {
          render: (form) => {
            expectTypeOf(form.state.values).toEqualTypeOf<Signup>()
            return null
          },
        },
      ],
    })
    expectTypeOf(Signup).not.toBeAny()
  })

  it('rejects a field the schema does not have', () => {
    registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      // @ts-expect-error a signup has no name
      fields: { name: { widget: 'text', props: { label: 'Name' } } },
    })
  })

  it('takes a layout of described keys and form components', () => {
    const Signup = registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      fields: {
        email: { widget: 'text', props: { label: 'Email' } },
        age: { widget: 'number', props: { label: 'Age' } },
      },
      layout: [
        { section: 'About you', layout: [{ row: ['email', 'age'] }] },
        { component: 'SubmitButton', props: { label: 'Sign up' } },
      ],
    })
    expectTypeOf(Signup).not.toBeAny()
  })

  it('takes fields and a layout written apart as FieldsOf and LayoutOf', () => {
    const signupFields: FieldsOf<typeof registry, Signup> = {
      email: { widget: 'text', props: { label: 'Email' } },
      age: { widget: 'number', props: { label: 'Age' } },
    }
    const signupLayout: LayoutOf<typeof registry, Signup> = [
      { section: 'About you', layout: [{ row: ['email', 'age'] }] },
      { component: 'SubmitButton', props: { label: 'Sign up' } },
    ]
    const Signup = registry.createForm({
      schema,
      defaultValues: { email: '', age: 0 },
      fields: signupFields,
      layout: signupLayout,
    })
    expectTypeOf(Signup).not.toBeAny()
  })
})

describe('Registry.Fields', () => {
  const registry = createRegistry({
    widgets: { text: TextField, number: NumberField },
  })
  type Address = { street: string; zip: string }
  type Customer = { name: string; billing: Address }

  it('types its entries by the values of the form it is given', () => {
    const Shell = (): ReactNode => {
      const form = registry.formHook.useAppForm({
        defaultValues: { name: '', billing: { street: '', zip: '' } } as Customer,
      })

      return (
        <registry.Fields
          form={form}
          fields={{
            name: {
              widget: 'text',
              props: { label: 'Name' },
              visibleWhen: (values) => {
                expectTypeOf(values).toEqualTypeOf<Customer>()
                return true
              },
            },
          }}
        />
      )
    }
    expectTypeOf(Shell).not.toBeAny()
  })

  it('types its entries by the values of a field group', () => {
    const addressGroup = registry.formHook.defineAppFieldGroup(({ strict }) => ({
      street: strict<string>(),
      zip: strict<string>(),
    }))
    const AddressFields = ({ group }: { group: typeof addressGroup.fields }): ReactNode => (
      <registry.Fields
        form={group}
        fields={{
          street: { widget: 'text', props: { label: 'Street' } },
          zip: {
            widget: 'text',
            props: { label: 'ZIP' },
            // TanStack Form v2 types a field group's values by its slots, which `defineAppFieldGroup`
            // keeps readonly.
            visibleWhen: (values) => {
              expectTypeOf(values).toEqualTypeOf<Readonly<Address>>()
              return true
            },
          },
        }}
      />
    )
    const AddressGroup = addressGroup.bindComponent(AddressFields, 'group')
    expectTypeOf(AddressGroup).toBeFunction()
  })

  it('rejects a widget that does not fit and a layout naming an undescribed key', () => {
    const Shell = (): ReactNode => {
      const form = registry.formHook.useAppForm({
        defaultValues: { name: '', billing: { street: '', zip: '' } } as Customer,
      })

      return (
        <>
          <registry.Fields
            form={form}
            // @ts-expect-error a number widget does not serve the name
            fields={{ name: { widget: 'number', props: { label: 'Name' } } }}
          />
          <registry.Fields
            form={form}
            fields={{ name: { widget: 'text', props: { label: 'Name' } } }}
            // @ts-expect-error billing is not described in fields
            layout={['name', 'billing']}
          />
        </>
      )
    }
    expectTypeOf(Shell).not.toBeAny()
  })

  it('takes fields and a layout written apart as FieldsOf and LayoutOf', () => {
    const customerFields: FieldsOf<typeof registry, Customer> = {
      name: { widget: 'text', props: { label: 'Name' } },
      billing: {
        fields: {
          street: { widget: 'text', props: { label: 'Street' } },
          zip: { widget: 'text', props: { label: 'Postal code' } },
        },
      },
    }
    const customerLayout: LayoutOf<typeof registry, Customer> = [{ row: ['name', 'billing'] }]
    const Shell = (): ReactNode => {
      const form = registry.formHook.useAppForm({
        defaultValues: { name: '', billing: { street: '', zip: '' } } as Customer,
      })

      return <registry.Fields form={form} fields={customerFields} layout={customerLayout} />
    }
    expectTypeOf(Shell).not.toBeAny()
  })

  it('rejects fields that are no object', () => {
    const Shell = (): ReactNode => {
      const form = registry.formHook.useAppForm({
        defaultValues: { name: '', billing: { street: '', zip: '' } } as Customer,
      })

      return (
        // @ts-expect-error fields describes the keys of the form's values
        <registry.Fields form={form} fields={42} />
      )
    }
    expectTypeOf(Shell).not.toBeAny()
  })

  it('rejects a prop the widget does not take', () => {
    const Shell = (): ReactNode => {
      const form = registry.formHook.useAppForm({
        defaultValues: { name: '', billing: { street: '', zip: '' } } as Customer,
      })

      return (
        <registry.Fields
          form={form}
          // @ts-expect-error the text widget takes no colour
          fields={{ name: { widget: 'text', props: { label: 'Name', colour: 'red' } } }}
        />
      )
    }
    expectTypeOf(Shell).not.toBeAny()
  })

  it("takes React's key, for a list of levels", () => {
    const Shell = (): ReactNode => {
      const form = registry.formHook.useAppForm({
        defaultValues: { name: '', billing: { street: '', zip: '' } } as Customer,
      })

      return ['name'].map((name) => (
        <registry.Fields
          key={name}
          form={form}
          fields={{ name: { widget: 'text', props: { label: 'Name' } } }}
        />
      ))
    }
    expectTypeOf(Shell).not.toBeAny()
  })

  it('hands an inline entry the form it is given', () => {
    const Shell = (): ReactNode => {
      const form = registry.formHook.useAppForm({
        defaultValues: { name: '', billing: { street: '', zip: '' } } as Customer,
      })

      return (
        <registry.Fields
          form={form}
          fields={{ name: { widget: 'text', props: { label: 'Name' } } }}
          layout={[
            'name',
            {
              render: (handle) => {
                expectTypeOf(handle).toEqualTypeOf<typeof form>()
                return null
              },
            },
          ]}
        />
      )
    }
    expectTypeOf(Shell).not.toBeAny()
  })
})
