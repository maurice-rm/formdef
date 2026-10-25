import { type FieldOf, fieldParts } from '@formdef/core'
import type { ComponentProps } from 'react'

import { FieldFrame } from '@/components/formdef/field-frame'
import { InputGroup, InputGroupAddon, InputGroupTextarea } from '@/components/ui/input-group'
import { Textarea } from '@/components/ui/textarea'
import type { Addon } from '@/lib/formdef/addons'
import type { FieldLabels } from '@/lib/formdef/field-labels'

type Attrs = Pick<
  ComponentProps<'textarea'>,
  | 'className'
  | 'placeholder'
  | 'autoComplete'
  | 'autoFocus'
  | 'disabled'
  | 'readOnly'
  | 'required'
  | 'maxLength'
  | 'rows'
  | 'spellCheck'
>

type TextareaFieldProps = FieldOf<string> &
  FieldLabels &
  Attrs & {
    addons?: Addon[]
  }

export const TextareaField = ({
  field,
  label,
  labelAside,
  description,
  addons = [],
  ...attrs
}: TextareaFieldProps) => {
  const parts = fieldParts(field, { description })
  const value = field.state.value ?? ''
  const hasAddons = addons.length > 0
  const Control = hasAddons ? InputGroupTextarea : Textarea
  const textarea = (
    <Control
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
          {textarea}
          {addons.map((addon) => (
            <InputGroupAddon key={addon.id} align={addon.align}>
              {addon.content}
            </InputGroupAddon>
          ))}
        </InputGroup>
      ) : (
        textarea
      )}
    </FieldFrame>
  )
}
