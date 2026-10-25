import { createFormHookContexts } from '@tanstack/react-form'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import type { FieldOf } from '../widget/field-of'
import { createRegistry } from './create-registry'

const { fieldContext, formContext } = createFormHookContexts()

const TextField = ({ field, label }: FieldOf<string> & { label: string }): ReactNode => (
  <label>
    {label}
    <input value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} />
  </label>
)

const NumberField = ({ field, label }: FieldOf<number> & { label: string }): ReactNode => (
  <label>
    {label}
    <input
      type="number"
      value={field.state.value}
      onChange={(event) => field.handleChange(event.target.valueAsNumber)}
    />
  </label>
)

const base = createRegistry({ fieldContext, formContext, widgets: { text: TextField } })
const extended = base.extendRegistry({ widgets: { number: NumberField } })

const SignIn = (): ReactNode => {
  const form = base.formHook.useAppForm({ defaultValues: { email: 'ada@example.com' } })

  return (
    <form.AppForm>
      <form.AppField name="email">
        {(field) => <field.text field={field} label="Email" />}
      </form.AppField>
    </form.AppForm>
  )
}

const Profile = (): ReactNode => {
  const form = extended.formHook.useAppForm({ defaultValues: { name: 'Ada', age: 36 } })

  return (
    <form.AppForm>
      <form.AppField name="name">
        {(field) => <field.text field={field} label="Name" />}
      </form.AppField>
      <form.AppField name="age">
        {(field) => <field.number field={field} label="Age" />}
      </form.AppField>
    </form.AppForm>
  )
}

const BaseWidgets = (): ReactNode => {
  const form = base.formHook.useAppForm({ defaultValues: { age: 36 } })

  return (
    <form.AppForm>
      <form.AppField name="age">
        {(field) => <output>{'number' in field ? 'extended' : 'unchanged'}</output>}
      </form.AppField>
    </form.AppForm>
  )
}

describe('createRegistry', () => {
  it("hands out TanStack's form hook with the registered widgets", () => {
    render(<SignIn />)

    expect(screen.getByLabelText('Email')).toHaveProperty('value', 'ada@example.com')
  })

  it("leaves out TanStack's own extension, which extendRegistry replaces", () => {
    expect(base.formHook).not.toHaveProperty('extendForm')
  })

  it('extends into a new registry with the widgets of both', () => {
    render(<Profile />)

    expect(screen.getByLabelText('Name')).toHaveProperty('value', 'Ada')
    expect(screen.getByLabelText('Age')).toHaveProperty('value', '36')
  })

  it('leaves the registry it extends unchanged', () => {
    render(<BaseWidgets />)

    expect(screen.getByText('unchanged')).toBeDefined()
  })
})

const profileSchema = z.object({ name: z.string().min(1, 'Enter a name'), age: z.number() })

afterEach(cleanup)

describe('registry.createForm', () => {
  it('renders a config with the widgets of the registry and submits its values', async () => {
    const onSubmit = vi.fn()
    const ProfileForm = extended.createForm({
      schema: profileSchema,
      defaultValues: { name: 'Ada', age: 36 },
      fields: {
        name: { widget: 'text', props: { label: 'Name' } },
        age: { widget: 'number', props: { label: 'Age' } },
      },
      onSubmit: ({ value }) => onSubmit(value),
    })
    render(<ProfileForm aria-label="Profile" />)

    expect(screen.getByLabelText('Age')).toHaveProperty('value', '36')
    await act(async () => {
      fireEvent.submit(screen.getByRole('form'))
    })

    expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada', age: 36 })
  })
})
