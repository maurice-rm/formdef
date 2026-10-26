'use client'

import { z } from 'zod'

import { createForm } from './registry'

const AMOUNT = /^\d+(,\d{1,2})?$/

export const TextFieldPreview = createForm({
  schema: z.object({
    email: z.email('Enter an email address'),
    amount: z.string().regex(AMOUNT, 'Enter an amount such as 12,50'),
  }),
  defaultValues: { email: '', amount: '' },
  fields: {
    email: {
      widget: 'text',
      props: { label: 'Email', type: 'email', autoComplete: 'email' },
    },
    amount: {
      widget: 'text',
      props: {
        label: 'Amount',
        description: 'In euros, with a comma before the cents.',
        inputMode: 'decimal',
        addons: [{ id: 'currency', content: '€', align: 'inline-end' }],
      },
    },
  },
  validation: { mode: 'blurThenChange' },
})
