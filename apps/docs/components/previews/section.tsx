'use client'

import { z } from 'zod'

import { createForm } from './registry'

export const SectionPreview = createForm({
  schema: z.object({ name: z.string(), email: z.string(), street: z.string(), city: z.string() }),
  defaultValues: { name: '', email: '', street: '', city: '' },
  fields: {
    name: { widget: 'text', props: { label: 'Name', autoComplete: 'name' } },
    email: { widget: 'text', props: { label: 'Email', type: 'email', autoComplete: 'email' } },
    street: { widget: 'text', props: { label: 'Street', autoComplete: 'street-address' } },
    city: { widget: 'text', props: { label: 'City', autoComplete: 'address-level2' } },
  },
  layout: [
    { section: 'Contact', layout: ['name', 'email'] },
    {
      section: 'Address',
      layout: ['street', 'city'],
      props: { description: 'Where we send the invoice.' },
    },
  ],
})
