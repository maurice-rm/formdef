'use client'

import { z } from 'zod'

import { createForm } from './registry'

const PASSWORD_MIN = 12

export const PasswordFieldPreview = createForm({
  schema: z.object({
    password: z.string().min(PASSWORD_MIN, 'Use at least 12 characters'),
  }),
  defaultValues: { password: '' },
  fields: {
    password: {
      widget: 'password',
      props: {
        label: 'Password',
        description: 'At least 12 characters.',
        autoComplete: 'new-password',
        labelAside: (
          <a href="#reset" className="text-sm underline underline-offset-4">
            Forgot password?
          </a>
        ),
      },
    },
  },
  validation: { mode: 'blurThenChange' },
})
