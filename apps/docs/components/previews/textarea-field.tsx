'use client'

import { z } from 'zod'

import { createForm } from './registry'

const MESSAGE_MAX = 500

export const TextareaFieldPreview = createForm({
  schema: z.object({
    message: z.string().min(1, 'Write a message').max(MESSAGE_MAX, 'Keep it under 500 characters'),
  }),
  defaultValues: { message: '' },
  fields: {
    message: {
      widget: 'textarea',
      props: { label: 'Message', description: 'Up to 500 characters.', rows: 4 },
    },
  },
  validation: { mode: 'blurThenChange' },
})
