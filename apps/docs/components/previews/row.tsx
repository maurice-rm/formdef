'use client'

import { z } from 'zod'

import { createForm } from './registry'

export const RowPreview = createForm({
  schema: z.object({ firstName: z.string(), lastName: z.string() }),
  defaultValues: { firstName: '', lastName: '' },
  fields: {
    firstName: { widget: 'text', props: { label: 'First name' } },
    lastName: { widget: 'text', props: { label: 'Last name' } },
  },
  layout: [{ row: ['firstName', 'lastName'] }],
})
