import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'

import { DateTimeField } from '@/components/formdef/date-time-field'
import { hiddenValueInputs } from './helpers/no-hidden-value'
import { describeWiring } from './helpers/wiring'

const { fieldContext, formContext } = createFormHookContexts()
const { createForm } = createRegistry({
  fieldContext,
  formContext,
  widgets: { dateTime: DateTimeField },
})

const formWith = (startsAt: string, props: Record<string, unknown> = {}) =>
  createForm({
    schema: z.object({ startsAt: z.string().min(1, 'Choose a start') }),
    defaultValues: { startsAt },
    formId: 'event',
    validation: { mode: 'onSubmit' },
    fields: {
      startsAt: {
        widget: 'dateTime',
        props: { label: 'Starts', description: 'Local time', className: 'max-w-md', ...props },
      },
    },
    layout: [
      'startsAt',
      {
        render: (form) => (
          <form.Subscribe selector={(state) => state.values.startsAt}>
            {(value) => <output>{value}</output>}
          </form.Subscribe>
        ),
      },
    ],
  })

const Form = formWith('')

const trigger = (): HTMLElement => screen.getByRole('button', { name: /Starts/ })
const time = (): HTMLInputElement =>
  document.getElementById('event-startsAt-time') as HTMLInputElement

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
  id: 'event-startsAt',
  description: 'Local time',
  error: 'Choose a start',
  invalidate: (control) => {
    fireEvent.submit(control.closest('form') as HTMLFormElement)
  },
})

describe('DateTimeField', () => {
  it('writes the chosen day with the default time when no time is set', async () => {
    render(<Form />)

    fireEvent.click(trigger())
    fireEvent.click(await screen.findByRole('button', { name: /March 14th, 2026/ }))

    expect(screen.getByRole('status').textContent).toBe('2026-03-14T12:00')
  })

  it('takes its default time from defaultTime', async () => {
    const Morning = formWith('', { defaultTime: '09:00' })
    render(<Morning />)

    fireEvent.click(trigger())
    fireEvent.click(await screen.findByRole('button', { name: /March 14th, 2026/ }))

    expect(screen.getByRole('status').textContent).toBe('2026-03-14T09:00')
  })

  it('writes a changed time to the stored day', () => {
    const Stored = formWith('2026-03-14T12:00')
    render(<Stored />)

    fireEvent.change(time(), { target: { value: '14:30' } })

    expect(screen.getByRole('status').textContent).toBe('2026-03-14T14:30')
  })

  it('names its time input by timeLabel and wires it like the trigger', () => {
    const German = formWith('2026-03-14T12:00', { timeLabel: 'Uhrzeit' })
    render(<German />)

    const input = time()
    expect(input.getAttribute('aria-labelledby')).toBe('event-startsAt-label event-startsAt-time')
    expect(input.getAttribute('aria-label')).toBe('Uhrzeit')
    expect(screen.getByText('Starts').id).toBe('event-startsAt-label')
    expect(input.getAttribute('aria-describedby')).toBe('event-startsAt-description')
    expect(input.getAttribute('name')).toBeNull()
  })

  it('keeps its time input disabled until a day is chosen', () => {
    render(<Form />)

    expect(time().disabled).toBe(true)
  })

  it('falls back to the default time when the time is cleared', () => {
    const Stored = formWith('2026-03-14T14:30')
    render(<Stored />)

    fireEvent.change(time(), { target: { value: '' } })

    expect(screen.getByRole('status').textContent).toBe('2026-03-14T12:00')
  })

  it('puts the class name on the row of both controls and renders no hidden value', () => {
    const { container } = render(<Form />)

    expect(trigger().parentElement?.classList).toContain('max-w-md')
    expect(hiddenValueInputs(container)).toEqual([])
  })
})
