import { createForm } from './registry.js'
import { schema } from './schema.js'

export const SignUp = createForm({
  schema,
  defaultValues: { email: '', terms: false },
  fields: {
    email: { widget: 'text', props: { label: 'Email', type: 'email' } },
    terms: { widget: 'checkbox', props: { label: 'I accept the terms' } },
  },
  layout: ['email', 'terms', { component: 'SubmitButton', props: { label: 'Sign up' } }],
})
