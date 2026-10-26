'use client'

import { z } from 'zod'

import { createForm } from './registry'

export const TagsFieldPreview = createForm({
  schema: z.object({ skills: z.array(z.string()) }),
  defaultValues: { skills: ['TypeScript'] },
  fields: {
    skills: {
      widget: 'tags',
      props: {
        label: 'Skills',
        placeholder: 'Add a skill',
        description: 'Press Enter to add what you typed.',
        suggestions: ['CSS', 'React', 'TypeScript', 'Testing'],
      },
    },
  },
})
