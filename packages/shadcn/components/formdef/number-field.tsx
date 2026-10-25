import { type FieldOf, fieldParts } from '@formdef/core'
import type { ComponentProps } from 'react'

import { FieldFrame, type FieldLabels } from '@/components/formdef/field-frame'
import { Input } from '@/components/ui/input'

type Attrs = Pick<
  ComponentProps<'input'>,
  | 'className'
  | 'placeholder'
  | 'autoComplete'
  | 'autoFocus'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'min'
  | 'max'
  | 'step'
>

type NumberFieldProps = FieldOf<number | undefined> & FieldLabels & Attrs

export const NumberField = ({
  field,
  label,
  labelAside,
  description,
  ...attrs
}: NumberFieldProps) => {
  const parts = fieldParts(field, { description })
  const value = field.state.value ?? ''

  return (
    <FieldFrame
      parts={parts}
      label={label}
      labelAside={labelAside}
      description={description}
      disabled={attrs.disabled}
    >
      <Input
        {...attrs}
        {...parts.control}
        type="number"
        value={value}
        onChange={(event) =>
          field.handleChange(event.target.value === '' ? undefined : event.target.valueAsNumber)
        }
      />
    </FieldFrame>
  )
}
