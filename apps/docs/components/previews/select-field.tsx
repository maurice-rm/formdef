'use client'

import { z } from 'zod'

import { createForm } from './registry'

export const SelectFieldPreview = createForm({
  schema: z.object({ country: z.string().min(1, 'Choose a country') }),
  defaultValues: { country: '' },
  fields: {
    country: {
      widget: 'select',
      props: {
        label: 'Country',
        placeholder: 'Choose a country',
        options: [
          { value: 'at', label: 'Austria' },
          { value: 'de', label: 'Germany' },
          { value: 'ch', label: 'Switzerland' },
        ],
      },
    },
  },
  validation: { mode: 'blurThenChange' },
})
