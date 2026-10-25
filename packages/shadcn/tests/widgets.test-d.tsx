import { createRegistry, type FormConfig } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { describe, expectTypeOf, it } from 'vitest'
import { z } from 'zod'

import { CheckboxField } from '@/components/formdef/checkbox-field'
import { NumberField } from '@/components/formdef/number-field'
import { PasswordField } from '@/components/formdef/password-field'
import { RadioField } from '@/components/formdef/radio-field'
import { SelectField } from '@/components/formdef/select-field'
import { SwitchField } from '@/components/formdef/switch-field'
import { TextField } from '@/components/formdef/text-field'
import { TextareaField } from '@/components/formdef/textarea-field'

const { fieldContext, formContext } = createFormHookContexts()

const registry = createRegistry({
  fieldContext,
  formContext,
  widgets: {
    text: TextField,
    textarea: TextareaField,
    password: PasswordField,
    number: NumberField,
  },
})

const schema = z.object({
  name: z.string(),
  bio: z.string(),
  password: z.string(),
  seats: z.number().optional(),
})

const defaultValues = { name: '', bio: '', password: '', seats: undefined }

describe('the text widgets', () => {
  it('register and serve the values they are written for', () => {
    const Form = registry.createForm({
      schema,
      defaultValues,
      fields: {
        name: { widget: 'text', props: { label: 'Name', type: 'text' } },
        bio: { widget: 'textarea', props: { label: 'Bio', rows: 4 } },
        password: { widget: 'password', props: { label: 'Password', reveal: { show: 'Show' } } },
        seats: { widget: 'number', props: { label: 'Seats', min: 1 } },
      },
    })
    expectTypeOf(Form).not.toBeAny()
  })

  it('reject a value they are not written for', () => {
    registry.createForm({
      schema,
      defaultValues,
      // @ts-expect-error a text widget does not serve a number
      fields: { seats: { widget: 'text', props: { label: 'Seats' } } },
    })
    registry.createForm({
      schema,
      defaultValues,
      // @ts-expect-error a number widget does not serve a string
      fields: { name: { widget: 'number', props: { label: 'Name' } } },
    })
  })

  it('reject an attribute outside their allowlist', () => {
    const config = {
      schema,
      defaultValues,
      fields: {
        // @ts-expect-error onChange belongs to the widget, not the config
        name: { widget: 'text', props: { label: 'Name', onChange: () => undefined } },
      },
    } satisfies FormConfig<typeof registry, typeof schema>
    expectTypeOf(config).not.toBeAny()
  })
})

describe('the choice widgets', () => {
  const choices = createRegistry({
    fieldContext,
    formContext,
    widgets: {
      checkbox: CheckboxField,
      switch: SwitchField,
      radio: RadioField,
      select: SelectField,
    },
  })
  const choiceSchema = z.object({ terms: z.boolean(), plan: z.string() })
  const values = { terms: false, plan: '' }
  const options = [{ value: 'basic', label: 'Basic' }]

  it('register and serve the values they are written for', () => {
    const Form = choices.createForm({
      schema: choiceSchema,
      defaultValues: values,
      fields: {
        terms: { widget: 'checkbox', props: { label: 'Terms' } },
        plan: { widget: 'select', props: { label: 'Plan', options, placeholder: 'Choose…' } },
      },
    })
    const Alternative = choices.createForm({
      schema: choiceSchema,
      defaultValues: values,
      fields: {
        terms: { widget: 'switch', props: { label: 'Terms', variant: 'card' } },
        plan: { widget: 'radio', props: { label: 'Plan', options, variant: 'card' } },
      },
    })
    expectTypeOf(Form).not.toBeAny()
    expectTypeOf(Alternative).not.toBeAny()
  })

  it('reject a value they are not written for, and options left out', () => {
    choices.createForm({
      schema: choiceSchema,
      defaultValues: values,
      // @ts-expect-error a checkbox does not serve a string
      fields: { plan: { widget: 'checkbox', props: { label: 'Plan' } } },
    })
    choices.createForm({
      schema: choiceSchema,
      defaultValues: values,
      // @ts-expect-error a select needs its options
      fields: { plan: { widget: 'select', props: { label: 'Plan' } } },
    })
  })
})
