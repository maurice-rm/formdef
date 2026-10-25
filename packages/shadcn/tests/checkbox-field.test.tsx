import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { CheckboxField } from '@/components/formdef/checkbox-field'
import { describeWiring } from './helpers/wiring'

const { fieldContext, formContext } = createFormHookContexts()
const { createForm } = createRegistry({
  fieldContext,
  formContext,
  widgets: { checkbox: CheckboxField },
})

const Form = createForm({
  schema: z.object({ terms: z.boolean().refine((accepted) => accepted, 'Accept the terms') }),
  defaultValues: { terms: false },
  formId: 'signup',
  validation: { mode: 'onSubmit' },
  fields: {
    terms: {
      widget: 'checkbox',
      props: {
        label: 'I accept the terms',
        description: 'You can read them first',
        className: 'mt-1',
      },
    },
  },
})

const terms = (): HTMLElement => screen.getByRole('checkbox', { name: 'I accept the terms' })

afterEach(cleanup)

describeWiring({
  Form,
  control: terms,
  id: 'signup-terms',
  description: 'You can read them first',
  error: 'Accept the terms',
  invalidate: (control) => {
    fireEvent.submit(control.closest('form') as HTMLFormElement)
  },
})

describe('CheckboxField', () => {
  it('writes its state to the form when clicked', () => {
    render(<Form />)

    fireEvent.click(terms())
    expect(terms().getAttribute('aria-checked')).toBe('true')

    fireEvent.click(terms())
    expect(terms().getAttribute('aria-checked')).toBe('false')
  })

  it('puts the class name on the checkbox', () => {
    render(<Form />)

    expect(terms().classList).toContain('mt-1')
  })
})
