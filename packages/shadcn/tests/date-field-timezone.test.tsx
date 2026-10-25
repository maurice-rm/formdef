import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, expect, it } from 'vitest'
import { z } from 'zod'

import { DateField } from '@/components/formdef/date-field'

// `new Date('2026-03-01')` is midnight UTC, still the 28th of February west of Greenwich. On a
// European clock the mistake is invisible, so this file runs on Honolulu's.
const HONOLULU = 'Pacific/Honolulu'
let previousZone: string | undefined

beforeAll(() => {
  previousZone = process.env.TZ
  process.env.TZ = HONOLULU
})

afterAll(() => {
  process.env.TZ = previousZone
})

afterEach(cleanup)

const { fieldContext, formContext } = createFormHookContexts()
const { createForm } = createRegistry({ fieldContext, formContext, widgets: { date: DateField } })

const Form = createForm({
  schema: z.object({ born: z.string() }),
  defaultValues: { born: '2026-03-01' },
  formId: 'signup',
  fields: { born: { widget: 'date', props: { label: 'Date of birth' } } },
  layout: [
    'born',
    {
      render: (form) => (
        <form.Subscribe selector={(state) => state.values.born}>
          {(value) => <output>{value}</output>}
        </form.Subscribe>
      ),
    },
  ],
})

it('reads and writes a stored day as that same day, west of Greenwich too', async () => {
  expect(new Date(2026, 2, 1).getTimezoneOffset()).toBeGreaterThan(0)
  render(<Form />)

  fireEvent.click(screen.getByRole('button', { name: /Date of birth/ }))
  const first = await screen.findByRole('button', { name: /March 1st, 2026/ })

  expect(first.getAttribute('data-selected-single')).toBe('true')

  fireEvent.click(screen.getByRole('button', { name: /March 2nd, 2026/ }))

  expect(screen.getByRole('status').textContent).toBe('2026-03-02')
})
