import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { TextareaField } from '@/components/formdef/textarea-field'
import { describeWiring } from './helpers/wiring'

const { fieldContext, formContext } = createFormHookContexts()
const { createForm } = createRegistry({
  fieldContext,
  formContext,
  widgets: { textarea: TextareaField },
})

const schema = z.object({ bio: z.string().min(10, 'Tell us more') })

const Form = createForm({
  schema,
  defaultValues: { bio: '' },
  formId: 'profile',
  validation: { mode: 'onBlur' },
  fields: {
    bio: {
      widget: 'textarea',
      props: {
        label: 'Bio',
        description: 'A few sentences',
        className: 'min-h-32',
        maxLength: 500,
        rows: 4,
      },
    },
  },
})

const WithAddons = createForm({
  schema,
  defaultValues: { bio: '' },
  fields: {
    bio: {
      widget: 'textarea',
      props: {
        label: 'Bio',
        className: 'min-h-32',
        addons: [{ id: 'count', content: <span>0 / 500</span>, align: 'block-end' }],
      },
    },
  },
})

const bio = (): HTMLTextAreaElement => screen.getByLabelText('Bio')

afterEach(cleanup)

describeWiring({
  Form,
  control: bio,
  id: 'profile-bio',
  description: 'A few sentences',
  error: 'Tell us more',
  invalidate: (control) => {
    fireEvent.change(control, { target: { value: 'Hi' } })
    fireEvent.blur(control)
  },
})

describe('TextareaField', () => {
  it('writes what is typed to the form', () => {
    render(<Form />)

    fireEvent.change(bio(), { target: { value: 'Mathematician and writer.' } })

    expect(bio().value).toBe('Mathematician and writer.')
  })

  it('hands the listed attributes, the field name and the class name to the textarea', () => {
    const { container } = render(<Form />)

    expect(bio().getAttribute('maxlength')).toBe('500')
    expect(bio().getAttribute('rows')).toBe('4')
    expect(bio().name).toBe('bio')
    expect(bio().classList).toContain('min-h-32')
    expect(container.querySelector('[data-slot="input-group"]')).toBeNull()
  })

  it('renders addons in an input group, with the class name still on the textarea', () => {
    const { container } = render(<WithAddons />)
    const group = container.querySelector('[data-slot="input-group"]')

    expect(bio().classList).toContain('min-h-32')
    expect(group?.contains(bio())).toBe(true)
    expect(group?.textContent).toContain('0 / 500')
  })
})
