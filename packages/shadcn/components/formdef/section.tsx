'use client'

import type { SectionProps } from '@formdef/core'
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

  return (
    <FieldSet className={className} aria-describedby={hasDescription ? descriptionId : undefined}>
      <FieldLegend variant={variant}>{label}</FieldLegend>
      {hasDescription && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
      <FieldGroup>{children}</FieldGroup>
    </FieldSet>
  )
}
