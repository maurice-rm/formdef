'use client'

import { z } from 'zod'

import { createForm } from './registry'

export const StepperPreview = createForm({
  schema: z.object({
    contact: z.object({
      name: z.string().min(1, 'Enter your name'),
      email: z.email('Enter an email'),
    }),
    heating: z.object({
      kind: z.enum(['gas', 'oil', 'heatPump']),
      consumption: z.number().optional(),
    }),
    wishes: z.object({ notes: z.string() }),
  }),
  defaultValues: {
    contact: { name: '', email: '' },
    heating: { kind: 'gas', consumption: undefined },
    wishes: { notes: '' },
  },
  fields: {
    contact: {
      fields: {
        name: { widget: 'text', props: { label: 'Name' } },
        email: { widget: 'text', props: { label: 'Email', type: 'email' } },
      },
    },
    heating: {
      fields: {
        kind: {
          widget: 'radio',
          props: {
            label: 'Heating',
            options: [
              { value: 'gas', label: 'Gas' },
              { value: 'oil', label: 'Oil' },
              { value: 'heatPump', label: 'Heat pump' },
            ],
          },
        },
        consumption: { widget: 'number', props: { label: 'Consumption last year (kWh)' } },
      },
    },
    wishes: { fields: { notes: { widget: 'textarea', props: { label: 'Notes' } } } },
  },
  layout: [
    { step: 'contact', label: 'Contact' },
    { step: 'heating', label: 'Current heating' },
    { step: 'wishes', label: 'Your wishes' },
  ],
})
