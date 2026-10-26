'use client'

import { z } from 'zod'

import { createForm } from './registry'

const formatDay = (iso: string): string =>
  new Date(`${iso}T00:00`).toLocaleDateString('en-GB', { dateStyle: 'long' })

export const DateFieldPreview = createForm({
  schema: z.object({ delivery: z.iso.date('Pick a delivery date') }),
  defaultValues: { delivery: '' },
  fields: {
    delivery: {
      widget: 'date',
      props: {
        label: 'Delivery date',
        description: 'We deliver on any day you pick.',
        format: formatDay,
      },
    },
  },
  validation: { mode: 'blurThenChange' },
})
