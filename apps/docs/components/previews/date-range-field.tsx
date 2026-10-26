'use client'

import { z } from 'zod'

import { createForm } from './registry'

const formatDay = (iso: string): string =>
  new Date(`${iso}T00:00`).toLocaleDateString('en-GB', { dateStyle: 'medium' })

export const DateRangeFieldPreview = createForm({
  schema: z.object({
    stay: z.object({ from: z.iso.date().optional(), to: z.iso.date().optional() }),
  }),
  defaultValues: { stay: {} },
  fields: {
    stay: { widget: 'dateRange', props: { label: 'Stay', format: formatDay } },
  },
})
