import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { z } from 'zod'

import { createForm } from '@/lib/formdef'

afterEach(cleanup)

it("renders a form of the setup inside shadcn's FieldGroup", () => {
  const Empty = createForm({ schema: z.object({}), defaultValues: {}, fields: {} })
  render(<Empty aria-label="Empty" />)

  const body = screen.getByRole('form').firstElementChild
  expect(body?.getAttribute('data-slot')).toBe('field-group')
})
