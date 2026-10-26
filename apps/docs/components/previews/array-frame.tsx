'use client'

import { z } from 'zod'

import { createForm } from './registry'

const MEMBERS_MAX = 4

export const ArrayFramePreview = createForm({
  schema: z.object({
    members: z.array(z.string()).max(MEMBERS_MAX, 'A team has at most four members'),
  }),
  defaultValues: { members: ['Ada', 'Grace'] },
  fields: {
    members: {
      newItem: () => '',
      addLabel: 'Add member',
      removeLabel: (member) => `Remove ${member || 'member'}`,
      props: { label: 'Team', description: 'Up to four members.', min: 1, max: MEMBERS_MAX },
      item: { widget: 'text', props: { label: 'Name' } },
    },
  },
})
