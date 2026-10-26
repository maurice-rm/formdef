'use client'

import { z } from 'zod'

import { createForm } from './registry'

export const CheckboxGroupFieldPreview = createForm({
  schema: z.object({ topics: z.array(z.string()).min(1, 'Choose at least one topic') }),
  defaultValues: { topics: ['releases'] },
  fields: {
    topics: {
      widget: 'checkboxes',
      props: {
        label: 'Topics',
        description: 'What we write to you about.',
        options: [
          { value: 'releases', label: 'Releases' },
          { value: 'security', label: 'Security notices' },
          { value: 'events', label: 'Events' },
        ],
      },
    },
  },
  validation: { mode: 'blurThenChange' },
})
