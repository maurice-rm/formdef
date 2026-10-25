import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { DateField } from '@/components/formdef/date-field'
import { hiddenValueInputs } from './helpers/no-hidden-value'
import { describeWiring } from './helpers/wiring'

const { fieldContext, formContext } = createFormHookContexts()
const { createForm } = createRegistry({ fieldContext, formContext, widgets: { date: DateField } })

const formWith = (props: Record<string, unknown> = {}, arrival = '') =>
  createForm({
    schema: z.object({ arrival: z.string().min(1, 'Choose a day') }),
    defaultValues: { arrival },
    formId: 'booking',
    validation: { mode: 'onSubmit' },
    fields: {
      arrival: {
        widget: 'date',
        props: {
          label: 'Arrival',
          description: 'The day you check in',
          className: 'w-56',
          ...props,
        },
      },
    },
    layout: [
      'arrival',
      {
        render: (form) => (
          <form.Subscribe selector={(state) => state.values.arrival}>
            {(value) => <output>{value}</output>}
          </form.Subscribe>
        ),
      },
    ],
  })

const Form = formWith()

const trigger = (): HTMLElement => screen.getByRole('button', { name: /Arrival/ })

// A calendar without a value opens on today's month; the tests pick days in a fixed one.
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
  id: 'booking-arrival',
  description: 'The day you check in',
  error: 'Choose a day',
  invalidate: (control) => {
    fireEvent.submit(control.closest('form') as HTMLFormElement)
  },
})

describe('DateField', () => {
  it('shows its placeholder, which can be replaced, until a day is chosen', () => {
    render(<Form />)
    expect(trigger().textContent).toContain('Pick a date')
    cleanup()

    const German = formWith({ placeholder: 'Datum wählen' })
    render(<German />)
    expect(trigger().textContent).toContain('Datum wählen')
  })

  it('writes the chosen day to the form as an ISO date', async () => {
    render(<Form />)

    fireEvent.click(trigger())
    fireEvent.click(await screen.findByRole('button', { name: /March 14th, 2026/ }))

    expect(screen.getByRole('status').textContent).toBe('2026-03-14')
  })

  it('shows the stored day through format', () => {
    const Formatted = formWith(
      { format: (iso: string) => iso.split('-').reverse().join('.') },
      '2026-03-14',
    )
    render(<Formatted />)

    expect(trigger().textContent).toContain('14.03.2026')
  })

  it('announces the chosen day as part of its name', () => {
    const Stored = formWith({}, '2026-03-14')
    render(<Stored />)

    expect(screen.getByRole('button', { name: 'Arrival 2026-03-14' })).toBeDefined()
  })

  it('throws with the path when min or max is no ISO date', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const Broken = formWith({ min: '2026-3-5' })

    expect(() => render(<Broken />)).toThrow(
      'formdef: field "arrival" bounds its dates with "2026-3-5", which is no ISO date (YYYY-MM-DD).',
    )
  })

  it('disables the days outside min and max', async () => {
    const Bounded = formWith({ min: '2026-03-05', max: '2026-03-20' })
    render(<Bounded />)

    fireEvent.click(trigger())

    expect(
      (await screen.findByRole('button', { name: /March 4th, 2026/ })).hasAttribute('disabled'),
    ).toBe(true)
    expect(screen.getByRole('button', { name: /March 21st, 2026/ }).hasAttribute('disabled')).toBe(
      true,
    )
    expect(screen.getByRole('button', { name: /March 10th, 2026/ }).hasAttribute('disabled')).toBe(
      false,
    )
  })

  it('puts the class name on its trigger and renders no hidden value', () => {
    const { container } = render(<Form />)

    expect(trigger().classList).toContain('w-56')
    expect(hiddenValueInputs(container)).toEqual([])
  })
})
