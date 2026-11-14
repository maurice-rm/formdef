import { Combobox as ComboboxPrimitive } from '@base-ui/react'
import { type FieldOf, useFieldParts } from '@formdef/core'
import { XIcon } from 'lucide-react'
import type { ComponentProps } from 'react'

import { FieldFrame } from '@/components/formdef/field-frame'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import type { FieldLabels } from '@/lib/formdef/field-labels'
import type { Option } from '@/lib/formdef/options'

type Attrs = Pick<ComponentProps<typeof Combobox>, 'disabled' | 'readOnly' | 'required'> &
  Pick<ComponentProps<typeof ComboboxChipsInput>, 'placeholder'> & {
    className?: string | undefined
  }

type MultiComboboxFieldProps = FieldOf<string[]> &
  FieldLabels &
  Attrs & {
    options: Option[]
    empty?: string | undefined
    removeLabel?: ((option: Option) => string) | undefined
  }

const NO_RESULTS = 'No results.'
const NONE_CHOSEN: string[] = []

const removeOption = (option: Option): string => `Remove ${option.label}`

export const MultiComboboxField = ({
  field,
  label,
  labelAside,
  description,
  options,
  empty = NO_RESULTS,
  removeLabel = removeOption,
  placeholder,
  className,
  ...attrs
}: MultiComboboxFieldProps) => {
  const anchor = useComboboxAnchor()
  const parts = useFieldParts(field, { description })
  const { name: _carriedByTheForm, ...input } = parts.control
  const values = field.state.value ?? NONE_CHOSEN
  const chosen = values.map(
    (value): Option => options.find((option) => option.value === value) ?? { value, label: value },
  )

  return (
    <FieldFrame
      parts={parts}
      label={label}
      labelAside={labelAside}
      description={description}
      disabled={attrs.disabled}
      required={attrs.required}
    >
      <Combobox
        {...attrs}
        multiple
        items={options}
        value={chosen}
        onValueChange={(next: Option[]) => field.handleChange(next.map((option) => option.value))}
        itemToStringLabel={(option: Option) => option.label}
        itemToStringValue={(option: Option) => option.value}
        isItemEqualToValue={(item: Option, value: Option) => item.value === value.value}
      >
        <ComboboxChips ref={anchor} className={className}>
          <ComboboxValue>
            {(selected: Option[]) => (
              <>
                {selected.map((option) => (
                  <ComboboxChip key={option.value} showRemove={false}>
                    {option.label}
                    <ComboboxPrimitive.ChipRemove
                      aria-label={removeLabel(option)}
                      render={<Button variant="ghost" size="icon-xs" />}
                      className="-ml-1 opacity-50 hover:opacity-100"
                      data-slot="combobox-chip-remove"
                    >
                      <XIcon className="pointer-events-none" />
                    </ComboboxPrimitive.ChipRemove>
                  </ComboboxChip>
                ))}
                <ComboboxChipsInput {...input} placeholder={placeholder} />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>{empty}</ComboboxEmpty>
          <ComboboxList>
            {(option: Option) => (
              <ComboboxItem key={option.value} value={option} disabled={option.disabled}>
                <span className="flex flex-col">
                  {option.label}
                  {option.description !== undefined && option.description !== '' && (
                    <span className="text-muted-foreground text-xs">{option.description}</span>
                  )}
                </span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </FieldFrame>
  )
}

MultiComboboxField.emptyValue = NONE_CHOSEN
