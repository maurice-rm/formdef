import { createRegistry } from '@formdef/core'

import { CheckboxField } from '@/components/formdef/checkbox-field'
import { CheckboxGroupField } from '@/components/formdef/checkbox-group-field'
import { DateField } from '@/components/formdef/date-field'
import { Heading } from '@/components/formdef/heading'
import { Notice } from '@/components/formdef/notice'
import { NumberField } from '@/components/formdef/number-field'
import { RadioField } from '@/components/formdef/radio-field'
import { Row } from '@/components/formdef/row'
import { Section } from '@/components/formdef/section'
import { SelectField } from '@/components/formdef/select-field'
import { Stepper } from '@/components/formdef/stepper'
import { TextField } from '@/components/formdef/text-field'
import { TextareaField } from '@/components/formdef/textarea-field'
import { FieldGroup } from '@/components/ui/field'
import { fieldContext, formContext } from '@/lib/formdef/context'

/**
 * The setup's registry as a project fills it, with the widgets and form components the shipped kinds name, under
 * the names the docs give them. It stands in for `@/lib/formdef` where `catalog.ts` is checked.
 */
export const registry = createRegistry({
  fieldContext,
  formContext,
  widgets: {
    text: TextField,
    textarea: TextareaField,
    number: NumberField,
    checkbox: CheckboxField,
    radio: RadioField,
    select: SelectField,
    checkboxes: CheckboxGroupField,
    date: DateField,
  },
  formComponents: { Notice, Heading },
  structure: { body: FieldGroup, section: Section, row: Row, stepper: Stepper },
})
