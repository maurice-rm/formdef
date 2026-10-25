import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { PasswordField } from '@/components/formdef/password-field'
import { describeWiring } from './helpers/wiring'

const { fieldContext, formContext } = createFormHookContexts()
const { createForm } = createRegistry({
  fieldContext,
  formContext,
  widgets: { password: PasswordField },
})

const schema = z.object({ password: z.string().min(8, 'At least 8 characters') })

const Form = createForm({
  schema,
  defaultValues: { password: '' },
  formId: 'signin',
  validation: { mode: 'onBlur' },
  fields: {
    password: {
      widget: 'password',
      props: {
        label: 'Password',
        description: 'Case sensitive',
        className: 'font-mono',
        autoComplete: 'current-password',
      },
    },
  },
})

const Disabled = createForm({
  schema,
  defaultValues: { password: '' },
  fields: {
    password: {
      widget: 'password',
      props: { label: 'Password', disabled: true, reveal: { show: 'Zeigen', hide: 'Verbergen' } },
    },
  },
})

const password = (): HTMLInputElement => screen.getByLabelText('Password')

afterEach(cleanup)

describeWiring({
  Form,
  control: password,
  id: 'signin-password',
  description: 'Case sensitive',
  error: 'At least 8 characters',
  invalidate: (control) => {
    fireEvent.change(control, { target: { value: 'short' } })
    fireEvent.blur(control)
  },
})

describe('PasswordField', () => {
  it('writes what is typed to the form', () => {
    render(<Form />)

    fireEvent.change(password(), { target: { value: 'correct horse' } })

    expect(password().value).toBe('correct horse')
  })

  it('hands the listed attributes, the field name and the class name to the input', () => {
    render(<Form />)

    expect(password().getAttribute('autocomplete')).toBe('current-password')
    expect(password().name).toBe('password')
    expect(password().classList).toContain('font-mono')
  })

  it('shows and hides the password through its button', () => {
    render(<Form />)
    expect(password().type).toBe('password')

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }))
    expect(password().type).toBe('text')

    fireEvent.click(screen.getByRole('button', { name: 'Hide password' }))
    expect(password().type).toBe('password')
  })

  it('takes the labels of its button from reveal, and disables it with the field', () => {
    render(<Disabled />)

    const reveal = screen.getByRole('button', { name: 'Zeigen' })
    expect(reveal).toHaveProperty('disabled', true)
  })
})
