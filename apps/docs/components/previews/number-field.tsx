'use client'

import { z } from 'zod'

import { createForm } from './registry'

const GUESTS_MAX = 8

export const NumberFieldPreview = createForm({
  schema: z.object({
    guests: z
      .number('Enter the number of guests')
      .int('Enter a whole number')
      .min(1, 'At least one guest')
      .max(GUESTS_MAX, 'At most eight guests'),
  }),
  defaultValues: { guests: 2 },
  fields: {
    guests: {
      widget: 'number',
      props: { label: 'Guests', min: 1, max: GUESTS_MAX, className: 'w-[10ch]' },
    },
  },
  validation: { mode: 'blurThenChange' },
})
