import type { FieldParts } from '@formdef/core'
import type { ReactNode } from 'react'

import { FieldNotes } from '@/components/formdef/field-notes'
import { LabelLine } from '@/components/formdef/label-line'
import { Field } from '@/components/ui/field'
import { type FieldLabels, labelIdFor } from '@/lib/formdef/field-labels'

type FieldFrameProps = FieldLabels & {
  parts: FieldParts
  disabled?: boolean | undefined
  required?: boolean | undefined
  children: ReactNode
}

export const FieldFrame = ({
  parts,
  label,
  labelAside,
  description,
  disabled,
  required,
  children,
}: FieldFrameProps) => (
  <Field data-invalid={parts.isErrorDue} data-disabled={disabled}>
    {label !== undefined && (
      <LabelLine
        id={labelIdFor(parts.control.id)}
        htmlFor={parts.control.id}
        aside={labelAside}
        required={required}
      >
        {label}
      </LabelLine>
    )}
    {children}
    <FieldNotes parts={parts} description={description} />
  </Field>
)
