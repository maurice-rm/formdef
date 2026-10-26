'use client'

import { z } from 'zod'

import { createForm } from './registry'

export const SwitchFieldPreview = createForm({
  schema: z.object({ newsletter: z.boolean(), reminders: z.boolean() }),
  defaultValues: { newsletter: true, reminders: false },
  fields: {
    newsletter: {
      widget: 'switch',
      props: { label: 'Newsletter', description: 'One email a month.' },
    },
    reminders: {
      widget: 'switch',
      props: { label: 'Reminders', description: 'A day before each booking.', variant: 'card' },
    },
  },
})
