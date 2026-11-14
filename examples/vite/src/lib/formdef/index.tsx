'use client'

import { createRegistry } from '@formdef/core'

import { CheckboxField } from '@/components/formdef/checkbox-field'
import { DateField } from '@/components/formdef/date-field'
import { MultiComboboxField } from '@/components/formdef/multi-combobox-field'
import { Section } from '@/components/formdef/section'
import { SelectField } from '@/components/formdef/select-field'
import { SubmitButton } from '@/components/formdef/submit-button'
import { TextField } from '@/components/formdef/text-field'
import { FieldGroup } from '@/components/ui/field'
import { fieldContext, formContext } from './context'

export const registry = createRegistry({
  fieldContext,
  formContext,
  widgets: {
    text: TextField,
    select: SelectField,
    multiCombobox: MultiComboboxField,
    date: DateField,
    checkbox: CheckboxField,
  },
  formComponents: { SubmitButton },
  structure: { body: FieldGroup, section: Section },
})

export const { createForm, Fields, formHook } = registry
