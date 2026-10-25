import { Combobox as ComboboxPrimitive } from '@base-ui/react'
import { type FieldOf, fieldParts } from '@formdef/core'
import { XIcon } from 'lucide-react'
import type { ComponentProps } from 'react'

import { FieldFrame } from '@/components/formdef/field-frame'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { InputGroupAddon, InputGroupButton } from '@/components/ui/input-group'
import type { FieldLabels } from '@/lib/formdef/field-labels'
import type { Option } from '@/lib/formdef/options'

type Attrs = Pick<ComponentProps<typeof Combobox>, 'disabled' | 'readOnly' | 'required'> &
  Pick<ComponentProps<typeof ComboboxInput>, 'className' | 'placeholder' | 'showClear'>

type ComboboxFieldProps = FieldOf<string> &
  FieldLabels &
  Attrs & {
    options: Option[]
    empty?: string | undefined
    clearLabel?: string | undefined
  }

const NO_RESULTS = 'No results.'
const CLEAR = 'Clear'

export const ComboboxField = ({
  field,
  label,
  labelAside,
  description,
  options,
  empty = NO_RESULTS,
  clearLabel = CLEAR,
  className,
  placeholder,
  showClear,
  ...attrs
}: ComboboxFieldProps) => {
  const parts = fieldParts(field, { description })
  const { name: _carriedByTheForm, ...input } = parts.control
  const value = field.state.value ?? ''
  const unknown: Option | null = value === '' ? null : { value, label: value }
  const selected = options.find((option) => option.value === value) ?? unknown

  return (
    <FieldFrame
      parts={parts}
      label={label}
      labelAside={labelAside}
      description={description}
      disabled={attrs.disabled}
    >
      <Combobox
        {...attrs}
        items={options}
        value={selected}
        onValueChange={(option) => field.handleChange(option?.value ?? '')}
        itemToStringLabel={(option) => option.label}
        itemToStringValue={(option) => option.value}
        isItemEqualToValue={(item, chosen) => item.value === chosen.value}
      >
        <ComboboxInput
          {...input}
          className={className}
          disabled={attrs.disabled}
          placeholder={placeholder}
        >
          {showClear === true && (
            <InputGroupAddon align="inline-end">
              <ComboboxPrimitive.Clear
                aria-label={clearLabel}
                disabled={attrs.disabled}
                render={<InputGroupButton variant="ghost" size="icon-xs" />}
              >
                <XIcon />
              </ComboboxPrimitive.Clear>
            </InputGroupAddon>
          )}
        </ComboboxInput>
        <ComboboxContent>
          <ComboboxEmpty>{empty}</ComboboxEmpty>
          <ComboboxList>
            {(option: Option) => (
              <ComboboxItem key={option.value} value={option} disabled={option.disabled}>
                {option.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </FieldFrame>
  )
}
