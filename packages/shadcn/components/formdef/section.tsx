'use client'

import type { SectionProps } from '@formdef/core'
import { cn } from 'cn'
import { type ComponentProps, useId } from 'react'

import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field'

type LegendVariant = NonNullable<ComponentProps<typeof FieldLegend>['variant']>

type SectionFrameProps = SectionProps &
  Pick<ComponentProps<typeof FieldSet>, 'className'> & {
    description?: string | undefined
    variant?: LegendVariant | undefined
  }

export const Section = ({
  label,
  description,
  variant = 'legend',
  className,
  children,
}: SectionFrameProps) => {
  const descriptionId = useId()
  const hasDescription = description !== undefined && description !== ''
  const isSeparated = variant === 'legend'

  const fieldSet = (
    <FieldSet
      className={isSeparated ? undefined : className}
      aria-describedby={hasDescription ? descriptionId : undefined}
    >
      <FieldLegend
        variant={variant}
        className="data-[variant=legend]:font-heading data-[variant=legend]:font-semibold"
      >
        {label}
      </FieldLegend>
      {hasDescription && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
      <FieldGroup>{children}</FieldGroup>
    </FieldSet>
  )

  return isSeparated ? (
    <div
      data-slot="section"
      className={cn(
        'not-in-data-[slot=field-row]:not-first:border-t not-in-data-[slot=field-row]:not-first:pt-8',
        className,
      )}
    >
      {fieldSet}
    </div>
  ) : (
    fieldSet
  )
}
