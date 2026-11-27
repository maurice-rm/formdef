import { formOptions, getFormHookHelpers, useSelector } from '@tanstack/react-form'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import type { FieldOf } from '../widget/field-of'
import { createRegistry } from './create-registry'

const TextField = ({ field, label }: FieldOf<string> & { label: string }): ReactNode => (
  <label>
    {label}
    <input value={field.value} onChange={(event) => field.handleChange(event.target.value)} />
  </label>
)

const signUpOptions = formOptions({ defaultValues: { email: '' } })

// Typed by the options it is created from; TanStack does not check them against the form that
// renders the component.
const { useFormContext } = getFormHookHelpers().formContext.create(signUpOptions)

const EmailEcho = (): ReactNode => {
  const form = useFormContext()
  const email: string = useSelector(form.atom, (state) => state.values.email)

  return <output aria-label="Echo">{email}</output>
}

const { createForm } = createRegistry({
  widgets: { text: TextField },
  formComponents: { EmailEcho },
})

const SignUp = createForm({
  schema: z.object({ email: z.string() }),
  defaultValues: { email: 'ada@example.com' },
  fields: { email: { widget: 'text', props: { label: 'Email' } } },
  layout: ['email', { component: 'EmailEcho' }],
})

const Order = createForm({
  schema: z.object({ total: z.number() }),
  defaultValues: { total: 3 },
  fields: {},
  layout: [{ component: 'EmailEcho' }],
})

afterEach(cleanup)

describe("TanStack's formContext in a formdef form", () => {
  it('hands a placed form component the form, and follows its values', async () => {
    render(<SignUp />)

    expect(screen.getByLabelText('Echo').textContent).toBe('ada@example.com')

    await act(async () => {
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'grace@example.com' } })
    })
    expect(screen.getByLabelText('Echo').textContent).toBe('grace@example.com')
  })

  it('types the form by the options it was created from, whatever form renders it', () => {
    render(<Order />)

    expect(screen.getByLabelText('Echo').textContent).toBe('')
  })
})
