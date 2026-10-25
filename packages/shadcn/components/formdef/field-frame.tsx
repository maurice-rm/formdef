import type { FieldParts } from '@formdef/core'
import type { ReactNode } from 'react'

import { LabelLine } from '@/components/formdef/label-line'
import { Field, FieldDescription, FieldError } from '@/components/ui/field'

export type FieldLabels = {
  label?: string | undefined
  labelAside?: ReactNode
  description?: string | undefined
}

type FieldFrameProps = FieldLabels & {
  parts: FieldParts
  disabled?: boolean | undefined
  children: ReactNode
}

export const FieldFrame = ({
  parts,
  label,
  labelAside,
  description,
  disabled,
  children,
}: FieldFrameProps) => (
  <Field data-invalid={parts.isErrorDue} data-disabled={disabled}>
    {label !== undefined && (
      <LabelLine htmlFor={parts.control.id} aside={labelAside}>
        {label}
      </LabelLine>
    )}
    {children}
    {description !== undefined && description !== '' && (
      <FieldDescription id={parts.descriptionId}>{description}</FieldDescription>
    )}
    {parts.isErrorDue && (
      <FieldError id={parts.errorId} errors={parts.errors.map((message) => ({ message }))} />
    )}
  </Field>
)
