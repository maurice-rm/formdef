'use client'

import { z } from 'zod'

import { createForm } from './registry'

const SLOW_SUBMIT_MS = 1500

const waitForServer = (): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, SLOW_SUBMIT_MS))

export const SubmitButtonPreview = createForm({
  schema: z.object({ email: z.email('Enter an email address') }),
  defaultValues: { email: '' },
  fields: {
    email: { widget: 'text', props: { label: 'Email', type: 'email', autoComplete: 'email' } },
  },
  layout: ['email', { component: 'SubmitButton', props: { label: 'Subscribe' } }],
  onSubmit: waitForServer,
})
