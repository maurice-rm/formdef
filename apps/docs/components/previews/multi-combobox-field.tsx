'use client'

import { z } from 'zod'

import { createForm } from './registry'

export const MultiComboboxFieldPreview = createForm({
  schema: z.object({ memberIds: z.array(z.string()).min(1, 'Choose at least one member') }),
  defaultValues: { memberIds: ['u_1'] },
  fields: {
    memberIds: {
      widget: 'multiCombobox',
      props: {
        label: 'Members',
        placeholder: 'Search accounts',
        empty: 'No account matches.',
        options: [
          { value: 'u_1', label: 'Ada Lovelace' },
          { value: 'u_2', label: 'Grace Hopper', description: 'No SSH key yet' },
          { value: 'u_3', label: 'Alan Turing' },
          { value: 'u_4', label: 'Margaret Hamilton' },
          { value: 'u_5', label: 'Linus Torvalds', disabled: true },
        ],
      },
    },
  },
  validation: { mode: 'blurThenChange' },
})
