import { type FieldOf, fieldParts } from '@formdef/core'
import type { ComponentProps } from 'react'

import { FieldNotes } from '@/components/formdef/field-notes'
import { Field, FieldContent, FieldLabel, FieldTitle } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import type { FieldLabels } from '@/lib/formdef/field-labels'

type Attrs = Pick<ComponentProps<typeof Switch>, 'className' | 'disabled' | 'readOnly' | 'required'>

const TITLE_SUFFIX = '-title'

type SwitchFieldProps = FieldOf<boolean> &
  Omit<FieldLabels, 'labelAside'> &
  Attrs & {
    variant?: 'split' | 'list' | 'card' | undefined
  }

export const SwitchField = ({
  field,
  label,
  description,
  variant = 'split',
  ...attrs
}: SwitchFieldProps) => {
  const parts = fieldParts(field, { description })
  const { name: _carriedByTheForm, ...control } = parts.control
  const checked = field.state.value ?? false
  const titleId = `${control.id}${TITLE_SUFFIX}`
  const isCard = variant === 'card'
  const toggle = (
    <Switch
      {...attrs}
      {...control}
      aria-labelledby={isCard && label !== undefined ? titleId : undefined}
      checked={checked}
      onCheckedChange={(isChecked) => field.handleChange(isChecked)}
    />
  )
  const notes = <FieldNotes parts={parts} description={description} />

  if (isCard) {
    return (
      <FieldLabel htmlFor={control.id}>
        <Field
          orientation="horizontal"
          data-invalid={parts.isErrorDue}
          data-disabled={attrs.disabled}
        >
          <FieldContent>
            {label !== undefined && <FieldTitle id={titleId}>{label}</FieldTitle>}
            {notes}
          </FieldContent>
          {toggle}
        </Field>
      </FieldLabel>
    )
  }

  const caption = label !== undefined && <FieldLabel htmlFor={control.id}>{label}</FieldLabel>

  return (
    <Field orientation="horizontal" data-invalid={parts.isErrorDue} data-disabled={attrs.disabled}>
      {variant === 'list' && toggle}
      <FieldContent>
        {caption}
        {notes}
      </FieldContent>
      {variant === 'split' && toggle}
    </Field>
  )
}
