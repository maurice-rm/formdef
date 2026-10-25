import { type FieldOf, fieldParts } from '@formdef/core'
import type { ComponentProps } from 'react'

import { FieldFrame } from '@/components/formdef/field-frame'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { FieldLabels } from '@/lib/formdef/field-labels'
import type { Option } from '@/lib/formdef/options'

type Attrs = Pick<ComponentProps<typeof Select>, 'disabled' | 'readOnly' | 'required'> &
  Pick<ComponentProps<typeof SelectTrigger>, 'className'>

type SelectFieldProps = FieldOf<string> &
  FieldLabels &
  Attrs & {
    options: Option[]
    placeholder?: string | undefined
  }

export const SelectField = ({
  field,
  label,
  labelAside,
  description,
  options,
  placeholder,
  className,
  ...attrs
}: SelectFieldProps) => {
  const parts = fieldParts(field, { description })
  const { name: _carriedByTheForm, ...trigger } = parts.control
  const value = field.state.value ?? ''

  return (
    <FieldFrame
      parts={parts}
      label={label}
      labelAside={labelAside}
      description={description}
      disabled={attrs.disabled}
    >
      <Select
        {...attrs}
        items={options}
        value={value}
        onValueChange={(chosen) => field.handleChange(chosen ?? '')}
      >
        <SelectTrigger {...trigger} className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false}>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </FieldFrame>
  )
}
