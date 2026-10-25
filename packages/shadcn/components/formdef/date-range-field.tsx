import { type FieldOf, fieldParts } from '@formdef/core'

import { type CalendarAttrs, CalendarPopover } from '@/components/formdef/calendar-popover'
import { FieldFrame } from '@/components/formdef/field-frame'
import { Calendar } from '@/components/ui/calendar'
import { fromIsoDate, outsideBounds, toIsoDate } from '@/lib/formdef/date'
import { type FieldLabels, labelIdFor } from '@/lib/formdef/field-labels'

type DateRange = {
  from?: string | undefined
  to?: string | undefined
}

type DateRangeFieldProps = FieldOf<DateRange> &
  FieldLabels &
  CalendarAttrs & {
    placeholder?: string | undefined
    format?: ((iso: string) => string) | undefined
    separator?: string | undefined
    numberOfMonths?: number | undefined
    className?: string | undefined
  }

const PICK_A_RANGE = 'Pick a date range'
const EN_DASH = ' – '
const TWO_MONTHS = 2

const asIs = (iso: string): string => iso

const isoOf = (date: Date | undefined): string | undefined =>
  date === undefined ? undefined : toIsoDate(date)

export const DateRangeField = ({
  field,
  label,
  labelAside,
  description,
  placeholder = PICK_A_RANGE,
  format = asIs,
  separator = EN_DASH,
  numberOfMonths = TWO_MONTHS,
  disabled,
  required,
  min,
  max,
  className,
  ...calendar
}: DateRangeFieldProps) => {
  const parts = fieldParts(field, { description })
  const { from, to } = field.state.value ?? {}
  const isEmpty = from === undefined && to === undefined
  const selected = isEmpty
    ? undefined
    : {
        from: from === undefined ? undefined : fromIsoDate(from),
        to: to === undefined ? undefined : fromIsoDate(to),
      }
  const text = isEmpty
    ? undefined
    : [from, to].flatMap((end) => (end === undefined ? [] : [format(end)])).join(separator)

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
        text={text}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={className}
      >
        <Calendar
          {...calendar}
          mode="range"
          numberOfMonths={numberOfMonths}
          selected={selected}
          {...(selected?.from === undefined ? {} : { defaultMonth: selected.from })}
          disabled={outsideBounds(min, max, field.name)}
          onSelect={(range) =>
            field.handleChange({ from: isoOf(range?.from), to: isoOf(range?.to) })
          }
        />
      </CalendarPopover>
    </FieldFrame>
  )
}
