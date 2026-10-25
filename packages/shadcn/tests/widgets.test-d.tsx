import { createRegistry, type FormConfig } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { describe, expectTypeOf, it } from 'vitest'
import { z } from 'zod'

import { CheckboxField } from '@/components/formdef/checkbox-field'
import { CheckboxGroupField } from '@/components/formdef/checkbox-group-field'
import { ComboboxField } from '@/components/formdef/combobox-field'
import { DateField } from '@/components/formdef/date-field'
import { DateRangeField } from '@/components/formdef/date-range-field'
import { DateTimeField } from '@/components/formdef/date-time-field'
import { NumberField } from '@/components/formdef/number-field'
import { PasswordField } from '@/components/formdef/password-field'
import { RadioField } from '@/components/formdef/radio-field'
import { SelectField } from '@/components/formdef/select-field'
import { SwitchField } from '@/components/formdef/switch-field'
import { TagsField } from '@/components/formdef/tags-field'
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

describe('the checkbox group and the combobox', () => {
  const lists = createRegistry({
    fieldContext,
    formContext,
    widgets: { checkboxes: CheckboxGroupField, combobox: ComboboxField },
  })
  const listSchema = z.object({ channels: z.array(z.string()), framework: z.string() })
  const values = { channels: [], framework: '' }
  const options = [{ value: 'next', label: 'Next.js' }]

  it('register and serve the values they are written for', () => {
    const Form = lists.createForm({
      schema: listSchema,
      defaultValues: values,
      fields: {
        channels: { widget: 'checkboxes', props: { label: 'Channels', options } },
        framework: { widget: 'combobox', props: { label: 'Framework', options, empty: 'None' } },
      },
    })
    expectTypeOf(Form).not.toBeAny()
  })

  it('reject a value they are not written for', () => {
    lists.createForm({
      schema: listSchema,
      defaultValues: values,
      // @ts-expect-error a checkbox group serves a list, not a string
      fields: { framework: { widget: 'checkboxes', props: { label: 'Framework', options } } },
    })
    lists.createForm({
      schema: listSchema,
      defaultValues: values,
      // @ts-expect-error a combobox serves a string, not a list
      fields: { channels: { widget: 'combobox', props: { label: 'Channels', options } } },
    })
  })
})

describe('the date widgets', () => {
  const dates = createRegistry({
    fieldContext,
    formContext,
    widgets: { date: DateField, dateRange: DateRangeField, dateTime: DateTimeField },
  })
  const dateSchema = z.object({
    arrival: z.string(),
    stay: z.object({ from: z.string().optional(), to: z.string().optional() }),
    startsAt: z.string(),
  })
  const values = { arrival: '', stay: {}, startsAt: '' }

  it('register and serve the values they are written for', () => {
    const Form = dates.createForm({
      schema: dateSchema,
      defaultValues: values,
      fields: {
        arrival: {
          widget: 'date',
          props: { label: 'Arrival', min: '2026-01-01', weekStartsOn: 1 },
        },
        stay: { widget: 'dateRange', props: { label: 'Stay', separator: ' bis ' } },
        startsAt: { widget: 'dateTime', props: { label: 'Starts', timeLabel: 'Uhrzeit' } },
      },
    })
    expectTypeOf(Form).not.toBeAny()
  })

  it('reject a value they are not written for', () => {
    dates.createForm({
      schema: dateSchema,
      defaultValues: values,
      // @ts-expect-error a range widget does not serve a single date
      fields: { arrival: { widget: 'dateRange', props: { label: 'Arrival' } } },
    })
  })
})

describe('the tags widget', () => {
  const tagging = createRegistry({ fieldContext, formContext, widgets: { tags: TagsField } })
  const tagSchema = z.object({ skills: z.array(z.string()), name: z.string() })

  it('registers and serves a list of strings', () => {
    const Form = tagging.createForm({
      schema: tagSchema,
      defaultValues: { skills: [], name: '' },
      fields: {
        skills: {
          widget: 'tags',
          props: { label: 'Skills', suggestions: ['react'], removeLabel: (tag) => `Remove ${tag}` },
        },
      },
    })
    expectTypeOf(Form).not.toBeAny()
  })

  it('rejects a string value', () => {
    tagging.createForm({
      schema: tagSchema,
      defaultValues: { skills: [], name: '' },
      // @ts-expect-error a tags widget serves a list, not a string
      fields: { name: { widget: 'tags', props: { label: 'Name' } } },
    })
  })
})
