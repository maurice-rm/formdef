'use client'

import { Combobox as ComboboxPrimitive } from '@base-ui/react'
import { type FieldOf, fieldParts } from '@formdef/core'
import { XIcon } from 'lucide-react'
import { type ComponentProps, type KeyboardEvent, useState } from 'react'

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

type Attrs = Pick<ComponentProps<typeof Combobox>, 'disabled' | 'readOnly' | 'required'> &
  Pick<ComponentProps<typeof ComboboxChipsInput>, 'placeholder'> & {
    className?: string | undefined
  }

type TagsFieldProps = FieldOf<string[]> &
  FieldLabels &
  Attrs & {
    suggestions?: string[] | undefined
    empty?: string | undefined
    removeLabel?: ((tag: string) => string) | undefined
  }

const NO_RESULTS = 'No results.'
const ENTER = 'Enter'

const removeTag = (tag: string): string => `Remove ${tag}`

const isPlainEnter = (event: KeyboardEvent<HTMLInputElement>): boolean =>
  event.key === ENTER &&
  !event.nativeEvent.isComposing &&
  !(event.shiftKey || event.ctrlKey || event.altKey || event.metaKey)

export const TagsField = ({
  field,
  label,
  labelAside,
  description,
  suggestions = [],
  empty = NO_RESULTS,
  removeLabel = removeTag,
  placeholder,
  className,
  ...attrs
}: TagsFieldProps) => {
  const anchor = useComboboxAnchor()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlighted, setHighlighted] = useState<string | undefined>()
  const parts = fieldParts(field, { description })
  const { name: _carriedByTheForm, ...input } = parts.control
  const tags = field.state.value ?? []
  const offered = suggestions.filter((suggestion) => !tags.includes(suggestion))

  const add = (text: string) => {
    const tag = text.trim()
    if (tag !== '' && !tags.includes(tag)) {
      field.handleChange([...tags, tag])
    }
    setQuery('')
  }

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
        multiple
        items={offered}
        value={tags}
        onValueChange={(next: string[]) => field.handleChange(next)}
        onItemHighlighted={(item: string | undefined) => setHighlighted(item)}
        inputValue={query}
        onInputValueChange={setQuery}
        open={isOpen && offered.length > 0}
        onOpenChange={setIsOpen}
      >
        <ComboboxChips ref={anchor} className={className}>
          <ComboboxValue>
            {(values: string[]) => (
              <>
                {values.map((tag) => (
                  <ComboboxChip key={tag} showRemove={false}>
                    {tag}
                    <ComboboxPrimitive.ChipRemove
                      aria-label={removeLabel(tag)}
                      render={<Button variant="ghost" size="icon-xs" />}
                      className="-ml-1 opacity-50 hover:opacity-100"
                      data-slot="combobox-chip-remove"
                    >
                      <XIcon className="pointer-events-none" />
                    </ComboboxPrimitive.ChipRemove>
                  </ComboboxChip>
                ))}
                <ComboboxChipsInput
                  {...input}
                  placeholder={placeholder}
                  onKeyDown={(event) => {
                    if (!isPlainEnter(event) || highlighted !== undefined || query.trim() === '') {
                      return
                    }
                    event.preventDefault()
                    add(query)
                  }}
                />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        {offered.length > 0 && (
          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty>{empty}</ComboboxEmpty>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        )}
      </Combobox>
    </FieldFrame>
  )
}
