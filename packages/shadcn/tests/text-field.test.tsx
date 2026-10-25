import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { TextField } from '@/components/formdef/text-field'
import { describeWiring } from './helpers/wiring'

const { fieldContext, formContext } = createFormHookContexts()
const { createForm } = createRegistry({ fieldContext, formContext, widgets: { text: TextField } })

const schema = z.object({ email: z.string().min(3, 'Too short') })

const Form = createForm({
  schema,
  defaultValues: { email: '' },
  formId: 'signup',
  validation: { mode: 'onBlur' },
  fields: {
    email: {
      widget: 'text',
      props: {
        label: 'Email',
        description: 'We never share it',
        type: 'email',
        className: 'w-full',
        autoComplete: 'email',
        maxLength: 64,
        required: true,
      },
    },
  },
})

const WithAddons = createForm({
  schema,
  defaultValues: { email: '' },
  fields: {
    email: {
      widget: 'text',
      props: {
        label: 'Email',
        className: 'w-full',
        addons: [
          { id: 'at', content: <span>@</span> },
          { id: 'check', content: <button type="button">Check</button>, align: 'inline-end' },
        ],
      },
    },
  },
})

const email = (): HTMLInputElement => screen.getByLabelText('Email')

afterEach(cleanup)

describeWiring({
  Form,
  control: email,
  id: 'signup-email',
  description: 'We never share it',
  error: 'Too short',
  invalidate: (control) => {
    fireEvent.change(control, { target: { value: 'a' } })
    fireEvent.blur(control)
  },
})

describe('TextField', () => {
  it('writes what is typed to the form', () => {
    render(<Form />)

    fireEvent.change(email(), { target: { value: 'ada@example.com' } })

    expect(email().value).toBe('ada@example.com')
  })

  it('hands the listed attributes and the field name to the input', () => {
    render(<Form />)

    expect(email().getAttribute('type')).toBe('email')
    expect(email().getAttribute('autocomplete')).toBe('email')
    expect(email().getAttribute('maxlength')).toBe('64')
    expect(email().required).toBe(true)
    expect(email().name).toBe('email')
  })

  it('puts the class name on the input when it stands alone', () => {
    const { container } = render(<Form />)

    expect(email().classList).toContain('w-full')
    expect(container.querySelector('[data-slot="input-group"]')).toBeNull()
  })

  it('renders addons in an input group, with the class name still on the input', () => {
    const { container } = render(<WithAddons />)
    const group = container.querySelector('[data-slot="input-group"]')

    expect(email().classList).toContain('w-full')
    expect(group?.contains(email())).toBe(true)
    expect(group?.textContent).toContain('@')
    expect(screen.getByRole('button', { name: 'Check' })).toBeDefined()
  })
})
