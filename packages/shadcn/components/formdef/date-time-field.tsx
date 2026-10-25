'use client'

import { type FieldOf, fieldParts } from '@formdef/core'
import { cn } from 'cn'
import { ClockIcon } from 'lucide-react'
import { useState } from 'react'

import { type CalendarAttrs, CalendarPopover } from '@/components/formdef/calendar-popover'
import { FieldFrame } from '@/components/formdef/field-frame'
import { Calendar } from '@/components/ui/calendar'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { fromIsoDate, outsideBounds, toIsoDate } from '@/lib/formdef/date'
import { type FieldLabels, labelIdFor } from '@/lib/formdef/field-labels'

type DateTimeFieldProps = FieldOf<string> &
  FieldLabels &
  CalendarAttrs & {
    placeholder?: string | undefined
    format?: ((iso: string) => string) | undefined
    timeLabel?: string | undefined
    defaultTime?: string | undefined
    className?: string | undefined
  }

const PICK_DATE_AND_TIME = 'Pick a date and time'
const TIME = 'Time'
const NOON = '12:00'
const DATE_TIME_SEPARATOR = 'T'
const TIME_SUFFIX = '-time'

const asIs = (iso: string): string => iso

export const DateTimeField = ({
  field,
  label,
  labelAside,
  description,
  placeholder = PICK_DATE_AND_TIME,
  format = asIs,
  timeLabel = TIME,
  defaultTime = NOON,
  disabled,
  required,
  min,
  max,
  className,
  ...calendar
}: DateTimeFieldProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const parts = fieldParts(field, { description })
  const [day = '', time = ''] = (field.state.value ?? '').split(DATE_TIME_SEPARATOR)
  const selected = day === '' ? undefined : fromIsoDate(day)
  const { name: _carriedByTheForm, id: controlId, ...wiring } = parts.control
  const timeId = `${controlId}${TIME_SUFFIX}`

  return (
    <FieldFrame
      parts={parts}
      label={label}
      labelAside={labelAside}
      description={description}
      disabled={disabled}
    >
      <div className={cn('flex gap-2', className)}>
        <CalendarPopover
          control={parts.control}
          labelId={label === undefined ? undefined : labelIdFor(parts.control.id)}
          text={day === '' ? undefined : format(day)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          className="flex-1"
        >
          <Calendar
            {...calendar}
            mode="single"
            selected={selected}
            {...(selected === undefined ? {} : { defaultMonth: selected })}
            disabled={outsideBounds(min, max, field.name)}
            onSelect={(picked) => {
              field.handleChange(
                picked === undefined
                  ? ''
                  : `${toIsoDate(picked)}${DATE_TIME_SEPARATOR}${time === '' ? defaultTime : time}`,
              )
              setIsOpen(false)
            }}
          />
        </CalendarPopover>
        <InputGroup className="w-auto">
          <InputGroupInput
            {...wiring}
            id={timeId}
            type="time"
            aria-label={timeLabel}
            aria-labelledby={label === undefined ? undefined : `${labelIdFor(controlId)} ${timeId}`}
            disabled={disabled === true || day === ''}
            value={time}
            onChange={(event) =>
              field.handleChange(
                `${day}${DATE_TIME_SEPARATOR}${event.target.value === '' ? defaultTime : event.target.value}`,
              )
            }
            className="appearance-none [&::-webkit-calendar-picker-indicator]:hidden"
          />
          <InputGroupAddon align="inline-end">
            <ClockIcon />
          </InputGroupAddon>
        </InputGroup>
      </div>
    </FieldFrame>
  )
}
