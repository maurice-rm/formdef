import type { FieldParts } from '@formdef/core'
import { cn } from 'cn'
import { CalendarIcon } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import type { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export type CalendarAttrs = Pick<
  ComponentProps<typeof Calendar>,
  | 'captionLayout'
  | 'showOutsideDays'
  | 'fixedWeeks'
  | 'weekStartsOn'
  | 'startMonth'
  | 'endMonth'
  | 'locale'
> & {
  disabled?: boolean | undefined
  required?: boolean | undefined
  min?: string | undefined
  max?: string | undefined
}

const VALUE_SUFFIX = '-value'

type CalendarPopoverProps = {
  control: FieldParts['control']
  labelId: string | undefined
  text: string | undefined
  placeholder: string
  disabled?: boolean | undefined
  required?: boolean | undefined
  isOpen?: boolean | undefined
  onOpenChange?: ((isOpen: boolean) => void) | undefined
  className?: string | undefined
  children: ReactNode
}

export const CalendarPopover = ({
  control,
  labelId,
  text,
  placeholder,
  disabled,
  required,
  isOpen,
  onOpenChange,
  className,
  children,
}: CalendarPopoverProps) => {
  const { name: _carriedByTheForm, ...trigger } = control
  const valueId = `${trigger.id}${VALUE_SUFFIX}`

  return (
    <Popover
      {...(isOpen === undefined ? {} : { open: isOpen })}
      {...(onOpenChange === undefined ? {} : { onOpenChange })}
    >
      <PopoverTrigger
        render={
          <Button
            {...trigger}
            disabled={disabled}
            aria-required={required}
            aria-labelledby={labelId === undefined ? undefined : `${labelId} ${valueId}`}
            variant="outline"
            className={cn('justify-start px-2.5 font-normal', className)}
          />
        }
      >
        <CalendarIcon data-icon="inline-start" />
        {text === undefined ? (
          <span id={valueId} className="text-muted-foreground">
            {placeholder}
          </span>
        ) : (
          <span id={valueId}>{text}</span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" aria-labelledby={trigger.id}>
        {children}
      </PopoverContent>
    </Popover>
  )
}
