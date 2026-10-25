import { type FieldOf, fieldParts } from '@formdef/core'
import type { ComponentProps } from 'react'

import { FieldFrame, type FieldLabels } from '@/components/formdef/field-frame'
import { Input } from '@/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import type { Addon } from '@/lib/formdef/addons'

type Attrs = Pick<
  ComponentProps<'input'>,
  | 'className'
  | 'placeholder'
  | 'autoComplete'
  | 'autoFocus'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'maxLength'
  | 'inputMode'
  | 'spellCheck'
> & {
  type?: 'text' | 'email' | 'search' | 'tel' | 'url'
}

type TextFieldProps = FieldOf<string> &
  FieldLabels &
  Attrs & {
    addons?: Addon[]
  }

export const TextField = ({
  field,
  label,
  labelAside,
  description,
  addons = [],
  ...attrs
}: TextFieldProps) => {
  const parts = fieldParts(field, { description })
  const value = field.state.value ?? ''
  const hasAddons = addons.length > 0
  const Control = hasAddons ? InputGroupInput : Input
  const input = (
    <Control
      type="text"
      {...attrs}
      {...parts.control}
      value={value}
      onChange={(event) => field.handleChange(event.target.value)}
    />
  )

  return (
    <FieldFrame
      parts={parts}
      label={label}
      labelAside={labelAside}
      description={description}
      disabled={attrs.disabled}
    >
      {hasAddons ? (
        <InputGroup>
          {input}
          {addons.map((addon) => (
            <InputGroupAddon key={addon.id} align={addon.align}>
              {addon.content}
            </InputGroupAddon>
          ))}
        </InputGroup>
      ) : (
        input
      )}
    </FieldFrame>
  )
}
