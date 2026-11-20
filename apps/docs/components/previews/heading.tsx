'use client'

import { z } from 'zod'

import { createForm } from './registry'

export const HeadingPreview = createForm({
  schema: z.object({ boiler: z.string(), year: z.string() }),
  defaultValues: { boiler: '', year: '' },
  fields: {
    boiler: { widget: 'text', props: { label: 'Boiler' } },
    year: { widget: 'text', props: { label: 'Year built', inputMode: 'numeric' } },
  },
  layout: [{ component: 'Heading', props: { children: 'Heating' } }, 'boiler', 'year'],
})
