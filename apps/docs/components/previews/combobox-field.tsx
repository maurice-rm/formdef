'use client'

import { z } from 'zod'

import { createForm } from './registry'

export const ComboboxFieldPreview = createForm({
  schema: z.object({ timeZone: z.string().min(1, 'Choose a time zone') }),
  defaultValues: { timeZone: '' },
  fields: {
    timeZone: {
      widget: 'combobox',
      props: {
        label: 'Time zone',
        placeholder: 'Search time zones',
        showClear: true,
        options: [
          { value: 'Europe/Berlin', label: 'Berlin' },
          { value: 'Europe/Lisbon', label: 'Lisbon' },
          { value: 'Europe/London', label: 'London' },
          { value: 'America/New_York', label: 'New York' },
          { value: 'Asia/Tokyo', label: 'Tokyo' },
        ],
      },
    },
  },
  validation: { mode: 'blurThenChange' },
})
