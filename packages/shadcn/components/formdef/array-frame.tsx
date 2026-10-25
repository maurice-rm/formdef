'use client'

import { type ArrayFrameProps, fieldParts } from '@formdef/core'
import { XIcon } from 'lucide-react'
import { type ComponentProps, useEffect, useRef } from 'react'

import { FieldNotes } from '@/components/formdef/field-notes'
import { Button } from '@/components/ui/button'
import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field'

type LegendVariant = NonNullable<ComponentProps<typeof FieldLegend>['variant']>

type ArrayFrameFrameProps = ArrayFrameProps<unknown> &
  Pick<ComponentProps<typeof FieldSet>, 'className'> & {
    label?: string | undefined
    description?: string | undefined
    variant?: LegendVariant | undefined
    min?: number | undefined
    max?: number | undefined
  }

export const ArrayFrame = ({
  field,
  keys,
  renderItem,
  add,
  remove,
  addLabel,
  removeLabels,
  label,
  description,
  variant = 'legend',
  min,
  max,
  className,
}: ArrayFrameFrameProps) => {
  const parts = fieldParts(field)
  const removeButtons = useRef<(HTMLButtonElement | null)[]>([])
  const addButton = useRef<HTMLButtonElement | null>(null)
  const removedAt = useRef<number | undefined>(undefined)
  const isAtMin = min !== undefined && keys.length <= min
  const isAtMax = max !== undefined && keys.length >= max
  const hasDescription = description !== undefined && description !== ''
  const describedBy = [
    ...(hasDescription ? [parts.descriptionId] : []),
    ...(parts.isErrorDue && parts.errors.length > 0 ? [parts.errorId] : []),
  ].join(' ')

  useEffect(() => {
    const index = removedAt.current
    if (index === undefined) {
      return
    }
    removedAt.current = undefined
    const next = removeButtons.current[index] ?? addButton.current
    next?.focus()
  })

  return (
    <FieldSet
      className={className}
      aria-invalid={parts.control['aria-invalid']}
      aria-describedby={describedBy === '' ? undefined : describedBy}
    >
      {label !== undefined && <FieldLegend variant={variant}>{label}</FieldLegend>}
      {hasDescription && (
        <FieldDescription id={parts.descriptionId}>{description}</FieldDescription>
      )}
      <FieldGroup>
        {keys.map((key, index) => (
          <div key={key} data-slot="array-item" className="flex items-start gap-2">
            <div className="min-w-0 flex-1">{renderItem(index)}</div>
            <Button
              ref={(button) => {
                removeButtons.current[index] = button
              }}
              type="button"
              variant="ghost"
              size="icon"
              aria-label={removeLabels[index]}
              disabled={isAtMin}
              onClick={() => {
                removedAt.current = index
                remove(index)
              }}
            >
              <XIcon />
            </Button>
          </div>
        ))}
        <Button
          ref={addButton}
          type="button"
          variant="outline"
          size="sm"
          disabled={isAtMax}
          onClick={add}
        >
          {addLabel}
        </Button>
      </FieldGroup>
      <FieldNotes parts={parts} />
    </FieldSet>
  )
}
