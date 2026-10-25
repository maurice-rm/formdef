'use client'

import { type FieldOf, fieldParts } from '@formdef/core'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { type ComponentProps, useState } from 'react'

import { FieldFrame, type FieldLabels } from '@/components/formdef/field-frame'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'

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
>

type PasswordFieldProps = FieldOf<string> &
  FieldLabels &
  Attrs & {
    reveal?: { show?: string | undefined; hide?: string | undefined } | undefined
  }

const SHOW_PASSWORD = 'Show password'
const HIDE_PASSWORD = 'Hide password'

export const PasswordField = ({
  field,
  label,
  labelAside,
  description,
  reveal,
  ...attrs
}: PasswordFieldProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const parts = fieldParts(field, { description })
  const value = field.state.value ?? ''
  const toggleLabel = isVisible ? (reveal?.hide ?? HIDE_PASSWORD) : (reveal?.show ?? SHOW_PASSWORD)

  return (
    <FieldFrame
      parts={parts}
      label={label}
      labelAside={labelAside}
      description={description}
      disabled={attrs.disabled}
    >
      <InputGroup>
        <InputGroupInput
          {...attrs}
          {...parts.control}
          type={isVisible ? 'text' : 'password'}
          spellCheck={false}
          autoCapitalize="none"
          value={value}
          onChange={(event) => field.handleChange(event.target.value)}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            disabled={attrs.disabled}
            aria-label={toggleLabel}
            onClick={() => setIsVisible((wasVisible) => !wasVisible)}
          >
            {isVisible ? <EyeOffIcon /> : <EyeIcon />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </FieldFrame>
  )
}
