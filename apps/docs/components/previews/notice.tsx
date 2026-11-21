'use client'

import { z } from 'zod'

import { createForm } from './registry'

export const NoticePreview = createForm({
  schema: z.object({ reading: z.string() }),
  defaultValues: { reading: '' },
  fields: { reading: { widget: 'text', props: { label: 'Meter reading', inputMode: 'decimal' } } },
  layout: [
    {
      component: 'Notice',
      props: { title: 'Before you start', children: 'The meter sits next to the boiler.' },
    },
    'reading',
  ],
})
