import type { FieldParts } from '@formdef/core'
import type { ReactNode } from 'react'

import { FieldDescription, FieldError } from '@/components/ui/field'
import { type DescriptionPosition, hasDescription } from '@/lib/formdef/field-labels'

type FieldNotesProps = {
  parts: FieldParts
  description?: ReactNode
  descriptionPosition?: DescriptionPosition | undefined
  children?: ReactNode
}

export const FieldNotes = ({
  parts,
  description,
  descriptionPosition = 'beforeControl',
  children,
}: FieldNotesProps) => {
  const hint = hasDescription(description) && (
    <FieldDescription id={parts.descriptionId}>{description}</FieldDescription>
  )
  const isHintFirst = descriptionPosition === 'beforeControl'

  return (
    <>
      {isHintFirst && hint}
      {children}
      {!isHintFirst && hint}
      {parts.isErrorDue && (
        <FieldError id={parts.errorId} errors={parts.errors.map((message) => ({ message }))} />
      )}
    </>
  )
}
