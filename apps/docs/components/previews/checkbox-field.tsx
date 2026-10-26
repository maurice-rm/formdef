'use client'

import { z } from 'zod'

import { createForm } from './registry'

export const CheckboxFieldPreview = createForm({
  schema: z.object({
    terms: z.boolean().refine((isAccepted) => isAccepted, 'Accept the terms to continue'),
  }),
  defaultValues: { terms: false },
  fields: {
    terms: {
      widget: 'checkbox',
      props: {
        label: 'I accept the terms',
        description: 'You can read them before you sign up.',
      },
    },
  },
  validation: { mode: 'blurThenChange' },
})
