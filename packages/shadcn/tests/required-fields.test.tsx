import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { CheckboxField } from '@/components/formdef/checkbox-field'
import { CheckboxGroupField } from '@/components/formdef/checkbox-group-field'
import { ComboboxField } from '@/components/formdef/combobox-field'
import { DateField } from '@/components/formdef/date-field'
import { DateRangeField } from '@/components/formdef/date-range-field'
import { DateTimeField } from '@/components/formdef/date-time-field'
import { MultiComboboxField } from '@/components/formdef/multi-combobox-field'
import { NumberField } from '@/components/formdef/number-field'
import { PasswordField } from '@/components/formdef/password-field'
import { RadioField } from '@/components/formdef/radio-field'
import { SelectField } from '@/components/formdef/select-field'
import { SwitchField } from '@/components/formdef/switch-field'
import { TagsField } from '@/components/formdef/tags-field'
import { TextField } from '@/components/formdef/text-field'
import { TextareaField } from '@/components/formdef/textarea-field'

const { fieldContext, formContext } = createFormHookContexts()
const { createForm } = createRegistry({
  fieldContext,
  formContext,
  widgets: {
    text: TextField,
    textarea: TextareaField,
    password: PasswordField,
    number: NumberField,
    select: SelectField,
    radio: RadioField,
    combobox: ComboboxField,
    multiCombobox: MultiComboboxField,
    tags: TagsField,
    checkbox: CheckboxField,
    checkboxGroup: CheckboxGroupField,
    switch: SwitchField,
    date: DateField,
    dateRange: DateRangeField,
    dateTime: DateTimeField,
  },
})

const OPTIONS = [{ value: 'basic', label: 'Basic' }]
const filled = z.string().min(1)
const someOf = z.array(z.string()).min(1)
const checked = z.boolean().refine(Boolean)
const optionalDay = z.iso.date().optional()

const Form = createForm({
  schema: z.object({
    name: filled,
    bio: filled,
    password: filled,
    seats: z
      .number()
      .optional()
      .refine((seats) => seats !== undefined),
    plan: filled,
    tier: filled,
    country: filled,
    members: someOf,
    tags: someOf,
    terms: checked,
    topics: someOf,
    alerts: checked,
    arrival: z.iso.date(),
    stay: z
      .object({ from: optionalDay, to: optionalDay })
      .refine((range) => range.from !== undefined && range.to !== undefined),
    startsAt: z.iso.datetime({ local: true }),
    nickname: z.string(),
  }),
  defaultValues: {
    name: '',
    bio: '',
    password: '',
    seats: undefined,
    plan: '',
    tier: '',
    country: '',
    members: [],
    tags: [],
    terms: false,
    topics: [],
    alerts: false,
    arrival: '',
    stay: {},
    startsAt: '',
    nickname: '',
  },
  fields: {
    name: { widget: 'text', props: { label: 'Name' } },
    bio: { widget: 'textarea', props: { label: 'Bio' } },
    password: { widget: 'password', props: { label: 'Password' } },
    seats: { widget: 'number', props: { label: 'Seats' } },
    plan: { widget: 'select', props: { label: 'Plan', options: OPTIONS } },
    tier: { widget: 'radio', props: { label: 'Tier', options: OPTIONS } },
    country: { widget: 'combobox', props: { label: 'Country', options: OPTIONS } },
    members: { widget: 'multiCombobox', props: { label: 'Members', options: OPTIONS } },
    tags: { widget: 'tags', props: { label: 'Tags' } },
    terms: { widget: 'checkbox', props: { label: 'Terms' } },
    topics: { widget: 'checkboxGroup', props: { label: 'Topics', options: OPTIONS } },
    alerts: { widget: 'switch', props: { label: 'Alerts' } },
    arrival: { widget: 'date', props: { label: 'Arrival' } },
    stay: { widget: 'dateRange', props: { label: 'Stay' } },
    startsAt: { widget: 'dateTime', props: { label: 'Starts at' } },
    nickname: { widget: 'text', props: { label: 'Nickname' } },
  },
})

const REQUIRED_LABELS = [
  'Name',
  'Bio',
  'Password',
  'Seats',
  'Plan',
  'Tier',
  'Country',
  'Members',
  'Tags',
  'Terms',
  'Topics',
  'Alerts',
  'Arrival',
  'Stay',
  'Starts at',
]

const isMarked = (label: string): boolean => screen.getByText(label).hasAttribute('data-required')

afterEach(cleanup)

describe('required fields', () => {
  it.each(REQUIRED_LABELS)('marks the label of %s, which the schema requires', (label) => {
    render(<Form />)

    expect(isMarked(label)).toBe(true)
  })

  it('leaves the label of a field the schema does not require unmarked', () => {
    render(<Form />)

    expect(isMarked('Nickname')).toBe(false)
  })

  it('keeps the label text free of the mark, so the field is found by its label', () => {
    render(<Form />)

    expect(screen.getByLabelText<HTMLInputElement>('Name').required).toBe(true)
    expect(screen.getByLabelText<HTMLInputElement>('Nickname').required).toBe(false)
  })
})
