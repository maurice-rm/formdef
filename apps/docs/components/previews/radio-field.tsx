'use client'

import { z } from 'zod'

import { createForm } from './registry'

export const RadioFieldPreview = createForm({
  schema: z.object({ plan: z.enum(['starter', 'team', 'enterprise'], 'Choose a plan') }),
  defaultValues: { plan: 'starter' },
  fields: {
    plan: {
      widget: 'radio',
      props: {
        label: 'Plan',
        variant: 'card',
        options: [
          { value: 'starter', label: 'Starter', description: 'One project, one person.' },
          { value: 'team', label: 'Team', description: 'Ten projects, ten people.' },
          { value: 'enterprise', label: 'Enterprise', description: 'Ask us.', disabled: true },
        ],
      },
    },
  },
})
