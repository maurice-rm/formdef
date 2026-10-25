import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { NumberField } from '@/components/formdef/number-field'
import { describeWiring } from './helpers/wiring'

const { fieldContext, formContext } = createFormHookContexts()
const { createForm } = createRegistry({
  fieldContext,
  formContext,
  widgets: { number: NumberField },
})

const schema = z.object({
  seats: z.number('Enter a number').min(1, 'At least one seat').optional(),
})

const onSubmit = vi.fn()

const Form = createForm({
  schema,
  defaultValues: { seats: 2 },
  formId: 'booking',
  validation: { mode: 'onBlur' },
  onSubmit: ({ value }) => onSubmit(value),
  fields: {
    seats: {
      widget: 'number',
      props: {
        label: 'Seats',
        description: 'Including yourself',
        className: 'w-[6ch]',
        min: 1,
        max: 9,
        step: 1,
      },
    },
  },
})

const seats = (): HTMLInputElement => screen.getByLabelText('Seats')

afterEach(cleanup)

describeWiring({
  Form,
  control: seats,
  id: 'booking-seats',
  description: 'Including yourself',
  error: 'At least one seat',
  invalidate: (control) => {
    fireEvent.change(control, { target: { value: '0' } })
    fireEvent.blur(control)
  },
})

describe('NumberField', () => {
  it('writes a typed number to the form as a number', async () => {
    onSubmit.mockClear()
    render(<Form />)

    fireEvent.change(seats(), { target: { value: '4' } })
    fireEvent.submit(seats().closest('form') as HTMLFormElement)

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ seats: 4 }))
  })

  it('writes undefined when the input is cleared', async () => {
    onSubmit.mockClear()
    render(<Form />)

    fireEvent.change(seats(), { target: { value: '' } })
    fireEvent.submit(seats().closest('form') as HTMLFormElement)

    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ seats: undefined }))
    expect(seats().value).toBe('')
  })

  it('hands the listed attributes, the field name and the class name to the input', () => {
    render(<Form />)

    expect(seats().type).toBe('number')
    expect(seats().getAttribute('min')).toBe('1')
    expect(seats().getAttribute('max')).toBe('9')
    expect(seats().name).toBe('seats')
    expect(seats().classList).toContain('w-[6ch]')
  })
})
