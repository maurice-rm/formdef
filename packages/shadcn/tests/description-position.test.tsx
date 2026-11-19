import { createRegistry } from '@formdef/core'
import { createFormHookContexts } from '@tanstack/react-form'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

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
import { TagsField } from '@/components/formdef/tags-field'
import { TextField } from '@/components/formdef/text-field'
import { TextareaField } from '@/components/formdef/textarea-field'

type Position = 'beforeControl' | 'afterControl' | undefined

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
    checkboxGroup: CheckboxGroupField,
    date: DateField,
    dateRange: DateRangeField,
    dateTime: DateTimeField,
  },
})

const OPTIONS = [{ value: 'basic', label: 'Basic' }]

const CONTROL = 'input:not([type=hidden]), textarea, button, [role=radiogroup], [role=combobox]'

const WIDGET_LABELS = [
  'Name',
  'Bio',
  'Password',
  'Seats',
  'Plan',
  'Tier',
  'Country',
  'Members',
  'Tags',
  'Topics',
  'Arrival',
  'Stay',
  'Starts at',
]

const formWith = (descriptionPosition: Position) => {
  const described = (label: string) => ({
    label,
    description: `Hint for ${label}`,
    ...(descriptionPosition === undefined ? {} : { descriptionPosition }),
  })

  return createForm({
    schema: z.object({
      name: z.string(),
      bio: z.string(),
      password: z.string(),
      seats: z.number().optional(),
      plan: z.string(),
      tier: z.string(),
      country: z.string(),
      members: z.array(z.string()),
      tags: z.array(z.string()),
      topics: z.array(z.string()),
      arrival: z.string(),
      stay: z.object({ from: z.string().optional(), to: z.string().optional() }),
      startsAt: z.string(),
    }),
    defaultValues: {
      name: '',
      bio: '',
      password: '',
      plan: '',
      tier: '',
      country: '',
      members: [],
      tags: [],
      topics: [],
      arrival: '',
      stay: {},
      startsAt: '',
    },
    fields: {
      name: { widget: 'text', props: described('Name') },
      bio: { widget: 'textarea', props: described('Bio') },
      password: { widget: 'password', props: described('Password') },
      seats: { widget: 'number', props: described('Seats') },
      plan: { widget: 'select', props: { ...described('Plan'), options: OPTIONS } },
      tier: { widget: 'radio', props: { ...described('Tier'), options: OPTIONS } },
      country: { widget: 'combobox', props: { ...described('Country'), options: OPTIONS } },
      members: { widget: 'multiCombobox', props: { ...described('Members'), options: OPTIONS } },
      tags: { widget: 'tags', props: described('Tags') },
      topics: { widget: 'checkboxGroup', props: { ...described('Topics'), options: OPTIONS } },
      arrival: { widget: 'date', props: described('Arrival') },
      stay: { widget: 'dateRange', props: described('Stay') },
      startsAt: { widget: 'dateTime', props: described('Starts at') },
    },
  })
}

const isHintBeforeControl = (label: string): boolean => {
  const hint = screen.getByText(`Hint for ${label}`)
  const frame = hint.closest('fieldset, [data-slot=field]') as HTMLElement
  const control = frame.querySelector(CONTROL) as HTMLElement

  return Boolean(hint.compareDocumentPosition(control) & Node.DOCUMENT_POSITION_FOLLOWING)
}

afterEach(cleanup)

describe('descriptionPosition', () => {
  it.each(WIDGET_LABELS)(
    'puts the hint of %s between its label and its control by default',
    (label) => {
      const Form = formWith(undefined)
      render(<Form />)

      expect(isHintBeforeControl(label)).toBe(true)
    },
  )

  it.each(WIDGET_LABELS)('puts the hint of %s below its control when asked to', (label) => {
    const Form = formWith('afterControl')
    render(<Form />)

    expect(isHintBeforeControl(label)).toBe(false)
  })
})
