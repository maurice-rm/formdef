'use client'

import { z } from 'zod'

import { createForm } from './registry'

export const DateTimeFieldPreview = createForm({
  schema: z.object({ meeting: z.iso.datetime({ local: true }) }),
  defaultValues: { meeting: '' },
  fields: {
    meeting: {
      widget: 'dateTime',
      props: { label: 'Meeting', defaultTime: '09:00' },
    },
  },
})
