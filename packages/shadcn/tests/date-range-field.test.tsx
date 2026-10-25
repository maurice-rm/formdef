import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { DateRangeField } from '@/components/formdef/date-range-field'
import { hiddenValueInputs } from './helpers/no-hidden-value'
import { describeWiring } from './helpers/wiring'

const { fieldContext, formContext } = createFormHookContexts()
const { createForm } = createRegistry({
  fieldContext,
  formContext,
  widgets: { range: DateRangeField },
})

type Stay = { from?: string | undefined; to?: string | undefined }

const schema = z.object({
  stay: z
    .object({ from: z.string().optional(), to: z.string().optional() })
    .refine((stay) => stay.from !== undefined && stay.to !== undefined, 'Choose both days'),
})

const formWith = (stay: Stay, props: Record<string, unknown> = {}) =>
  createForm({
    schema,
    defaultValues: { stay },
    formId: 'booking',
    validation: { mode: 'onSubmit' },
    fields: {
      stay: {
        widget: 'range',
        props: { label: 'Stay', description: 'Arrival and departure', className: 'w-72', ...props },
      },
    },
    layout: [
      'stay',
      {
        render: (form) => (
          <form.Subscribe selector={(state) => state.values.stay}>
            {(value) => (
              <output aria-label="Stored stay">{`${value.from ?? '-'}/${value.to ?? '-'}`}</output>
            )}
          </form.Subscribe>
        ),
      },
    ],
  })

const Form = formWith({})

const trigger = (): HTMLElement => screen.getByRole('button', { name: /Stay/ })

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 2, 10))
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describeWiring({
  Form,
  control: trigger,
  id: 'booking-stay',
  description: 'Arrival and departure',
  error: 'Choose both days',
  invalidate: (control) => {
    fireEvent.submit(control.closest('form') as HTMLFormElement)
  },
})

describe('DateRangeField', () => {
  it('shows its placeholder until a range is chosen', () => {
    render(<Form />)

    expect(trigger().textContent).toContain('Pick a date range')
  })

  it('writes both ends of the chosen range to the form', async () => {
    render(<Form />)

    fireEvent.click(trigger())
    fireEvent.click(
      (await screen.findAllByRole('button', { name: /March 12th, 2026/ }))[0] as HTMLElement,
    )
    fireEvent.click(screen.getAllByRole('button', { name: /March 15th, 2026/ })[0] as HTMLElement)

    expect(screen.getByRole('status', { name: 'Stored stay' }).textContent).toBe(
      '2026-03-12/2026-03-15',
    )
  })

  it('shows both ends joined by a separator that can be replaced', () => {
    const Both = formWith({ from: '2026-03-12', to: '2026-03-15' }, { separator: ' bis ' })
    render(<Both />)

    expect(trigger().textContent).toContain('2026-03-12 bis 2026-03-15')
  })

  it('shows only the end that is set', () => {
    const Half = formWith({ from: '2026-03-12' })
    render(<Half />)

    expect(trigger().textContent).toContain('2026-03-12')
    expect(trigger().textContent).not.toContain('–')
  })

  it('shows a stored range that has only its end', () => {
    const EndOnly = formWith({ to: '2026-03-15' })
    render(<EndOnly />)

    expect(trigger().textContent).toContain('2026-03-15')
    expect(trigger().textContent).not.toContain('Pick a date range')
  })

  it('puts the class name on its trigger and renders no hidden value', () => {
    const { container } = render(<Form />)

    expect(trigger().classList).toContain('w-72')
    expect(hiddenValueInputs(container)).toEqual([])
  })
})
