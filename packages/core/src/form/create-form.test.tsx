import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createRef, type ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import type { BodyProps } from '../config/structure'
import type { FieldOf } from '../widget/field-of'
import { createForm } from './create-form'

const { fieldContext, formContext, useFormContext } = createFormHookContexts()

const TextField = ({ field, label }: FieldOf<string> & { label: string }): ReactNode => (
  <label>
    {label}
    <input
      name={field.name}
      value={field.state.value}
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
  fieldContext,
  formContext,
  fieldComponents: widgets,
  formComponents,
})

const BINDING = { useAppForm, parts: { widgets, formComponents, structure: {} } }
const BINDING_WITH_BODY = {
  useAppForm,
  parts: { widgets, formComponents, structure: { body: Body } },
}

const schema = z.object({ email: z.email('Enter an email') })

const DEFAULT_VALUES = { email: 'ada@example.com' }

type SubmitErrorForm = {
  Subscribe: (props: {
    selector: (state: { errorMap: { onSubmit?: unknown } }) => unknown
    children: (error: unknown) => ReactNode
  }) => ReactNode
}

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

  it('keeps the schema when the instance adds a validator of its own', async () => {
    const onSubmit = vi.fn()
    const onSubmitAsync = vi.fn(() => undefined)
    const SignIn = createForm(BINDING, signInConfig({ onSubmit }))
    render(<SignIn options={{ validators: { onSubmitAsync } }} />)

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

  // A blur while the submit runs clears the server's error before TanStack reads it, and the
  // submit then goes through; this pins the behaviour without a focus move, which holds.
  it('stops a submit the server rejects through onSubmitAsync', async () => {
    const onSubmit = vi.fn()
    const SignIn = createForm(
      BINDING,
      signInConfig({
        onSubmit,
        validators: {
          onSubmitAsync: async () => ({ form: 'Wrong credentials', fields: {} }),
        },
        layout: [
          'email',
          SUBMIT,
          {
            render: (form: SubmitErrorForm) => (
              <form.Subscribe selector={(state) => state.errorMap.onSubmit}>
                {(error) => (error ? <div role="alert">{String(error)}</div> : null)}
              </form.Subscribe>
            ),
          },
        ],
      }),
    )
    render(<SignIn />)
    screen.getByLabelText('Email').focus()

    await submit()

    expect((await screen.findByRole('alert')).textContent).toBe('Wrong credentials')
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
