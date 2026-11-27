import { createFormHook, formOptions, getFormHookHelpers } from '@tanstack/react-form'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createRef, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import type { BodyProps } from '../config/structure'
import { Fields } from '../render/fields'
import type { RenderForm } from '../render/render-form'
import type { FieldOf } from '../widget/field-of'
import { useFieldParts } from '../widget/use-field-parts'
import { createForm, type FormBinding } from './create-form'

const { useFormContext } = getFormHookHelpers().formContext.create(
  formOptions({ defaultValues: {} }),
)

const TextField = ({ field, label }: FieldOf<string> & { label: string }): ReactNode => (
  <label>
    {label}
    <input
      name={field.name}
      value={field.value}
      onBlur={field.handleBlur}
      onChange={(event) => field.handleChange(event.target.value)}
    />
  </label>
)

const SubmitButton = ({ label }: { label: string }): ReactNode => {
  const form = useFormContext()

  return <button type="submit">{`${label}${form.state.isSubmitting ? '…' : ''}`}</button>
}

const Body = ({ children }: BodyProps): ReactNode => <div data-testid="body">{children}</div>

const widgets = { text: TextField }
const formComponents = { SubmitButton }

const { useAppForm } = createFormHook({
  fieldComponents: widgets,
  formComponents,
})

// TanStack's hook is generic over the form's types; a binding passes the merged options untyped, as
// the registry does.
const untyped = (hook: unknown): FormBinding['useAppForm'] => hook as FormBinding['useAppForm']

const BINDING = {
  useAppForm: untyped(useAppForm),
  parts: { widgets, formComponents, structure: {} },
}
const BINDING_WITH_BODY = {
  useAppForm: untyped(useAppForm),
  parts: { widgets, formComponents, structure: { body: Body } },
}

const schema = z.object({ email: z.email('Enter an email') })

const DEFAULT_VALUES = { email: 'ada@example.com' }

type SubmitErrorForm = {
  Subscribe: (props: {
    selector: (state: { errors: readonly { message: string }[] }) => unknown
    children: (error: unknown) => ReactNode
  }) => ReactNode
}

const FormError = ({ form }: { form: SubmitErrorForm }): ReactNode => (
  <form.Subscribe selector={(state) => state.errors[0]?.message}>
    {(error) => (error ? <div role="alert">{String(error)}</div> : null)}
  </form.Subscribe>
)

/** A form validator that runs on submit only, as a server check does. */
const onSubmitOnly = (run: () => unknown): object => ({ run, triggers: [] })

const SUBMIT = { component: 'SubmitButton', props: { label: 'Sign in' } }

const signInConfig = (rest: Record<string, unknown> = {}): Record<string, unknown> => ({
  schema,
  defaultValues: DEFAULT_VALUES,
  fields: { email: { widget: 'text', props: { label: 'Email' } } },
  layout: ['email', SUBMIT],
  ...rest,
})

const submit = async (): Promise<void> => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))
  })
}

const MarkedField = ({
  field,
  label,
  required,
}: FieldOf<string> & { label: string; required?: boolean }): ReactNode => (
  <label>
    {label}
    <input
      required={required}
      value={field.value}
      onChange={(event) => field.handleChange(event.target.value)}
    />
  </label>
)
MarkedField.emptyValue = ''

const PlainField = (props: FieldOf<string> & { label: string }): ReactNode => (
  <output aria-label={props.label}>{'required' in props ? 'told' : 'untold'}</output>
)

const requiredWidgets = { marked: MarkedField, plain: PlainField }
const requiredBinding = {
  useAppForm: untyped(
    createFormHook({
      fieldComponents: requiredWidgets,
      formComponents: {},
    }).useAppForm,
  ),
  parts: { widgets: requiredWidgets, formComponents: {}, structure: {} },
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('createForm', () => {
  it('renders the fields of its config into a form element that skips native validation', () => {
    const SignIn = createForm(BINDING, signInConfig())
    render(<SignIn />)

    const form = screen.getByRole('textbox').closest('form')
    expect(form?.noValidate).toBe(true)
    expect(screen.getByLabelText('Email')).toHaveProperty('value', 'ada@example.com')
  })

  it('hands the form element its props and its ref', () => {
    const SignIn = createForm(BINDING, signInConfig())
    const ref = createRef<HTMLFormElement>()
    render(<SignIn ref={ref} className="sign-in" aria-label="Sign in form" noValidate={false} />)

    const form = screen.getByRole('form', { name: 'Sign in form' })
    expect(form.className).toBe('sign-in')
    expect(ref.current).toBe(form)
    expect(ref.current?.noValidate).toBe(false)
  })

  it('wraps the fields in a registered body, and in nothing without one', () => {
    const Wrapped = createForm(BINDING_WITH_BODY, signInConfig())
    const { unmount } = render(<Wrapped aria-label="Wrapped" />)
    expect(screen.getByTestId('body').parentElement).toBe(screen.getByRole('form'))
    unmount()

    const Bare = createForm(BINDING, signInConfig())
    render(<Bare aria-label="Bare" />)
    expect(screen.getByRole('textbox').parentElement?.parentElement).toBe(screen.getByRole('form'))
  })

  it('submits the values through the config, without navigating', async () => {
    const onSubmit = vi.fn()
    const SignIn = createForm(
      BINDING,
      signInConfig({ onSubmit: ({ value }: { value: unknown }) => onSubmit(value) }),
    )
    render(<SignIn aria-label="Sign in form" />)

    let isNavigating = true
    await act(async () => {
      isNavigating = fireEvent.submit(screen.getByRole('form'))
    })

    expect(isNavigating).toBe(false)
    expect(onSubmit).toHaveBeenCalledWith(DEFAULT_VALUES)
  })

  it('does not submit values the schema rejects', async () => {
    const onSubmit = vi.fn()
    const SignIn = createForm(BINDING, signInConfig({ onSubmit }))
    render(<SignIn />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada' } })
    await submit()

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("lets the instance's options win over the config's", async () => {
    const fromConfig = vi.fn()
    const fromInstance = vi.fn()
    const SignIn = createForm(BINDING, signInConfig({ onSubmit: fromConfig }))
    render(
      <SignIn
        options={{
          defaultValues: { email: 'grace@example.com' },
          onSubmit: ({ value }: { value: unknown }) => fromInstance(value),
        }}
      />,
    )

    await submit()

    expect(fromConfig).not.toHaveBeenCalled()
    expect(fromInstance).toHaveBeenCalledWith({ email: 'grace@example.com' })
  })

  // TanStack Form v2 runs every form validator on submit, whatever the ones before it found; v1 ran
  // the asynchronous ones only once the synchronous ones passed. The instance's validator runs twice.
  it.fails('keeps the schema when the instance adds a validator of its own', async () => {
    const onSubmit = vi.fn()
    const onSubmitAsync = vi.fn(() => undefined)
    const SignIn = createForm(BINDING, signInConfig({ onSubmit }))
    render(<SignIn options={{ validators: [onSubmitOnly(onSubmitAsync)] }} />)

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'ada' } })
    await submit()
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'grace@example.com' } })
    await submit()

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmitAsync).toHaveBeenCalledTimes(1)
  })

  it('takes its default values from the options when the config has none', () => {
    const SignIn = createForm(BINDING, signInConfig({ defaultValues: undefined }))
    render(<SignIn options={{ defaultValues: { email: 'grace@example.com' } }} />)

    expect(screen.getByLabelText('Email')).toHaveProperty('value', 'grace@example.com')
  })

  it('throws when neither the config nor the options hold default values', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const SignIn = createForm(BINDING, signInConfig({ defaultValues: undefined }))

    expect(() => render(<SignIn />)).toThrow(
      'formdef: the form has no default values; set defaultValues in its config or in its options.',
    )
  })

  it('stops a submit the server rejects through a validator on submit', async () => {
    const onSubmit = vi.fn()
    const SignIn = createForm(
      BINDING,
      signInConfig({
        onSubmit,
        validators: [onSubmitOnly(async () => ({ form: 'Wrong credentials', fields: {} }))],
        layout: ['email', SUBMIT, { render: (form: SubmitErrorForm) => <FormError form={form} /> }],
      }),
    )
    render(<SignIn />)
    screen.getByLabelText('Email').focus()

    await submit()

    expect((await screen.findByRole('alert')).textContent).toBe('Wrong credentials')
    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('createForm, required fields', () => {
  const marked = (label: string, props: object = {}): object => ({
    widget: 'marked',
    props: { label, ...props },
  })

  const isRequired = (label: string): boolean =>
    (screen.getByLabelText(label) as HTMLInputElement).required

  it('tells a widget with an empty value whether its field is required', () => {
    const Profile = createForm(requiredBinding, {
      schema: z.object({ name: z.string().min(1), nickname: z.string() }),
      defaultValues: { name: '', nickname: '' },
      fields: { name: marked('Name'), nickname: marked('Nickname') },
    })
    render(<Profile />)

    expect(isRequired('Name')).toBe(true)
    expect(isRequired('Nickname')).toBe(false)
  })

  it('lets a required in the props of the config win', () => {
    const Profile = createForm(requiredBinding, {
      schema: z.object({ name: z.string().min(1), nickname: z.string() }),
      defaultValues: { name: '', nickname: '' },
      fields: {
        name: marked('Name', { required: false }),
        nickname: marked('Nickname', { required: true }),
      },
    })
    render(<Profile />)

    expect(isRequired('Name')).toBe(false)
    expect(isRequired('Nickname')).toBe(true)
  })

  it('marks the fields of every item of an array', () => {
    const Contacts = createForm(requiredBinding, {
      schema: z.object({ contacts: z.array(z.object({ name: z.string().min(1) })) }),
      defaultValues: { contacts: [{ name: 'Ada' }, { name: '' }] },
      fields: { contacts: { item: { fields: { name: marked('Name') } } } },
    })
    render(<Contacts />)

    const inputs = screen.getAllByLabelText('Name') as HTMLInputElement[]
    expect(inputs.map((input) => input.required)).toEqual([true, true])
  })

  it('tells a widget without an empty value nothing', () => {
    const Profile = createForm(requiredBinding, {
      schema: z.object({ name: z.string().min(1) }),
      defaultValues: { name: '' },
      fields: { name: { widget: 'plain', props: { label: 'Name' } } },
    })
    render(<Profile />)

    expect(screen.getByLabelText('Name').textContent).toBe('untold')
  })

  it('marks no field and warns once when the config validates asynchronously', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const Profile = createForm(requiredBinding, {
      schema: z.object({ name: z.string().min(1) }).refine(async () => true),
      validation: { mode: 'onSubmit', async: true },
      defaultValues: { name: '' },
      fields: { name: marked('Name') },
    })
    render(<Profile />)
    render(<Profile />)

    expect(
      screen.getAllByLabelText('Name').map((input) => (input as HTMLInputElement).required),
    ).toEqual([false, false])
    // TanStack Form v2 alpha warns on every form built with validators that their count changed,
    // since its constructor compares them with `null`; only formdef's warnings count here.
    const formdefWarnings = warn.mock.calls.filter(([message]) =>
      String(message).startsWith('formdef:'),
    )
    expect(formdefWarnings).toHaveLength(1)
    expect(formdefWarnings[0]?.[0]).toContain('validates asynchronously')
  })

  it('finds nothing for a Fields inside the form, whose paths may be those of a field group', () => {
    const Profile = createForm(requiredBinding, {
      schema: z.object({ name: z.string().min(1) }),
      defaultValues: { name: '' },
      fields: { name: marked('Name') },
      layout: [
        {
          render: (form: RenderForm) => (
            <Fields parts={requiredBinding.parts} form={form} fields={{ name: marked('Again') }} />
          ),
        },
      ],
    })
    render(<Profile />)

    expect(isRequired('Again')).toBe(false)
  })
})

const PartsField = ({ field, label }: FieldOf<string> & { label: string }): ReactNode => {
  const { control } = useFieldParts(field)

  return (
    <div>
      <label htmlFor={control.id}>{label}</label>
      <input
        {...control}
        value={field.value}
        onChange={(event) => field.handleChange(event.target.value)}
      />
    </div>
  )
}
PartsField.emptyValue = ''

const CHOICES = ['oil', 'gas']

// Like a radio group of the registry: the field's id sits on a group that takes no focus itself.
const ChoiceGroupField = ({ field, label }: FieldOf<string> & { label: string }): ReactNode => {
  const { control } = useFieldParts(field)

  return (
    <div id={control.id} role="radiogroup" aria-label={label}>
      {CHOICES.map((choice) => (
        <label key={choice}>
          {choice}
          <input
            type="radio"
            name={control.name}
            checked={field.value === choice}
            onChange={() => field.handleChange(choice)}
          />
        </label>
      ))}
    </div>
  )
}
ChoiceGroupField.emptyValue = ''

const partsWidgets = { text: PartsField, choice: ChoiceGroupField }
const { useAppForm: usePartsForm } = createFormHook({
  fieldComponents: partsWidgets,
  formComponents,
})
const PARTS_BINDING = {
  useAppForm: untyped(usePartsForm),
  parts: { widgets: partsWidgets, formComponents, structure: {} },
}

describe('createForm without steps, focus', () => {
  const contactConfig = (rest: Record<string, unknown> = {}): Record<string, unknown> => ({
    schema: z.object({
      name: z.string().min(1, 'Enter a name'),
      email: z.email('Enter an email'),
      phone: z.string().min(1, 'Enter a phone number'),
    }),
    defaultValues: { name: 'Ada', email: '', phone: '' },
    fields: {
      name: { widget: 'text', props: { label: 'Name' } },
      email: { widget: 'text', props: { label: 'Email' } },
      phone: { widget: 'text', props: { label: 'Phone' } },
    },
    layout: ['name', 'email', 'phone', SUBMIT],
    ...rest,
  })

  it('focuses the first invalid control when the form fails to submit', async () => {
    const Contact = createForm(PARTS_BINDING, contactConfig())
    render(<Contact />)

    await submit()

    expect(document.activeElement).toBe(screen.getByLabelText('Email'))
  })

  it('focuses the first control inside a group that takes no focus itself', async () => {
    const Heating = createForm(PARTS_BINDING, {
      schema: z.object({ kind: z.string().min(1, 'Pick a kind') }),
      defaultValues: { kind: '' },
      fields: { kind: { widget: 'choice', props: { label: 'Kind' } } },
      layout: ['kind', SUBMIT],
    })
    render(<Heating />)

    await submit()

    expect(document.activeElement).toBe(screen.getByLabelText('oil'))
  })

  it('keeps the focus, and so the error, when the server rejects the whole form', async () => {
    const Contact = createForm(
      PARTS_BINDING,
      contactConfig({
        defaultValues: { name: 'Ada', email: 'ada@example.com', phone: '123' },
        validators: [
          onSubmitOnly(async () => ({
            form: 'Wrong credentials',
            fields: { email: 'Unknown account' },
          })),
        ],
        layout: [
          'name',
          'email',
          'phone',
          SUBMIT,
          { render: (form: SubmitErrorForm) => <FormError form={form} /> },
        ],
      }),
    )
    render(<Contact />)
    const phone = screen.getByLabelText('Phone')
    phone.focus()
    await act(async () => {
      fireEvent.change(phone, { target: { value: '1234' } })
    })

    await submit()

    expect((await screen.findByRole('alert')).textContent).toBe('Wrong credentials')
    expect(document.activeElement).toBe(screen.getByLabelText('Phone'))
  })

  it('leaves the focus where it is when the form submits', async () => {
    const onSubmit = vi.fn()
    const Contact = createForm(
      PARTS_BINDING,
      contactConfig({
        onSubmit,
        defaultValues: { name: 'Ada', email: 'ada@example.com', phone: '123' },
      }),
    )
    render(<Contact />)
    screen.getByLabelText('Phone').focus()

    await submit()

    expect(onSubmit).toHaveBeenCalledOnce()
    expect(document.activeElement).toBe(screen.getByLabelText('Phone'))
  })
})
