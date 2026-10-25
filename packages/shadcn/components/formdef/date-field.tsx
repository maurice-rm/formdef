'use client'

import { type FieldOf, fieldParts } from '@formdef/core'
import { useState } from 'react'

import { type CalendarAttrs, CalendarPopover } from '@/components/formdef/calendar-popover'
import { FieldFrame } from '@/components/formdef/field-frame'
import { Calendar } from '@/components/ui/calendar'
import { fromIsoDate, outsideBounds, toIsoDate } from '@/lib/formdef/date'
import { type FieldLabels, labelIdFor } from '@/lib/formdef/field-labels'

type DateFieldProps = FieldOf<string> &
  FieldLabels &
  CalendarAttrs & {
    placeholder?: string | undefined
    format?: ((iso: string) => string) | undefined
    className?: string | undefined
  }

const PICK_A_DATE = 'Pick a date'

const asIs = (iso: string): string => iso

export const DateField = ({
  field,
  label,
  labelAside,
  description,
  placeholder = PICK_A_DATE,
  format = asIs,
  disabled,
  required,
  min,
  max,
  className,
  ...calendar
}: DateFieldProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const parts = fieldParts(field, { description })
  const value = field.state.value ?? ''
  const selected = value === '' ? undefined : fromIsoDate(value)

  return (
    <FieldFrame
      parts={parts}
      label={label}
      labelAside={labelAside}
      description={description}
      disabled={disabled}
    >
      <CalendarPopover
        control={parts.control}
        labelId={label === undefined ? undefined : labelIdFor(parts.control.id)}
        text={value === '' ? undefined : format(value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        className={className}
      >
        <Calendar
          {...calendar}
          mode="single"
          selected={selected}
          {...(selected === undefined ? {} : { defaultMonth: selected })}
          disabled={outsideBounds(min, max, field.name)}
          onSelect={(day) => {
            field.handleChange(day === undefined ? '' : toIsoDate(day))
            setIsOpen(false)
          }}
        />
      </CalendarPopover>
    </FieldFrame>
  )
}
