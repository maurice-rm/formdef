'use client'

import { createRegistry } from '@formdef/core'
import { ArrayFrame } from '@formdef/shadcn/components/formdef/array-frame'
import { CheckboxField } from '@formdef/shadcn/components/formdef/checkbox-field'
import { CheckboxGroupField } from '@formdef/shadcn/components/formdef/checkbox-group-field'
import { ComboboxField } from '@formdef/shadcn/components/formdef/combobox-field'
import { DateField } from '@formdef/shadcn/components/formdef/date-field'
import { DateRangeField } from '@formdef/shadcn/components/formdef/date-range-field'
import { DateTimeField } from '@formdef/shadcn/components/formdef/date-time-field'
import { NumberField } from '@formdef/shadcn/components/formdef/number-field'
import { PasswordField } from '@formdef/shadcn/components/formdef/password-field'
import { RadioField } from '@formdef/shadcn/components/formdef/radio-field'
import { Row } from '@formdef/shadcn/components/formdef/row'
import { Section } from '@formdef/shadcn/components/formdef/section'
import { SelectField } from '@formdef/shadcn/components/formdef/select-field'
import { SubmitButton } from '@formdef/shadcn/components/formdef/submit-button'
import { SwitchField } from '@formdef/shadcn/components/formdef/switch-field'
import { TagsField } from '@formdef/shadcn/components/formdef/tags-field'
import { TextField } from '@formdef/shadcn/components/formdef/text-field'
import { TextareaField } from '@formdef/shadcn/components/formdef/textarea-field'
import { FieldGroup } from '@formdef/shadcn/components/ui/field'
import { fieldContext, formContext } from '@formdef/shadcn/lib/formdef/context'

export const { createForm } = createRegistry({
  fieldContext,
  formContext,
  widgets: {
    text: TextField,
    textarea: TextareaField,
    password: PasswordField,
    number: NumberField,
    checkbox: CheckboxField,
    switch: SwitchField,
    radio: RadioField,
    select: SelectField,
    checkboxes: CheckboxGroupField,
    combobox: ComboboxField,
    date: DateField,
    dateRange: DateRangeField,
    dateTime: DateTimeField,
    tags: TagsField,
  },
  formComponents: { SubmitButton },
  structure: { body: FieldGroup, section: Section, row: Row, arrayFrame: ArrayFrame },
})
