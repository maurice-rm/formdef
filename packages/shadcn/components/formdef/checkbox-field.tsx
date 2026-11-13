'use client'

import { type FieldOf, useFieldParts } from '@formdef/core'
import type { ComponentProps } from 'react'

import { FieldNotes } from '@/components/formdef/field-notes'
import { LabelText } from '@/components/formdef/label-text'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldContent, FieldLabel } from '@/components/ui/field'
import type { FieldLabels } from '@/lib/formdef/field-labels'

type Attrs = Pick<
  ComponentProps<typeof Checkbox>,
  'className' | 'disabled' | 'readOnly' | 'required'
>

type CheckboxFieldProps = FieldOf<boolean> & Omit<FieldLabels, 'labelAside'> & Attrs

export const CheckboxField = ({ field, label, description, ...attrs }: CheckboxFieldProps) => {
  const parts = useFieldParts(field, { description })
  const { name: _carriedByTheForm, ...control } = parts.control
  const checked = field.state.value ?? false

  return (
    <Field orientation="horizontal" data-invalid={parts.isErrorDue} data-disabled={attrs.disabled}>
      <Checkbox
        {...attrs}
        {...control}
        checked={checked}
        onCheckedChange={(isChecked) => field.handleChange(isChecked)}
      />
      <FieldContent>
        {label !== undefined && (
          <FieldLabel htmlFor={control.id}>
            <LabelText required={attrs.required}>{label}</LabelText>
          </FieldLabel>
        )}
        <FieldNotes parts={parts} description={description} />
      </FieldContent>
    </Field>
  )
}

CheckboxField.emptyValue = false
