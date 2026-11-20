'use client'

import type { SectionProps } from '@formdef/core'
import { cn } from 'cn'
import { type ComponentProps, type ReactNode, useId } from 'react'

import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from '@/components/ui/field'
import { hasDescription } from '@/lib/formdef/field-labels'

type LegendVariant = NonNullable<ComponentProps<typeof FieldLegend>['variant']>

type SectionFrameProps = SectionProps &
  Pick<ComponentProps<typeof FieldSet>, 'className'> & {
    description?: ReactNode
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
  const isDescribed = hasDescription(description)
  const isSeparated = variant === 'legend'

  const fieldSet = (
    <FieldSet
      className={isSeparated ? undefined : className}
      aria-describedby={isDescribed ? descriptionId : undefined}
    >
      <FieldLegend
        variant={variant}
        className="data-[variant=legend]:font-heading data-[variant=legend]:font-semibold"
      >
        {label}
      </FieldLegend>
      {isDescribed && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
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
