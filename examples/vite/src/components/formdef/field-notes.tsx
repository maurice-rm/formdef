import type { FieldParts } from '@formdef/core'

import { FieldDescription, FieldError } from '@/components/ui/field'

type FieldNotesProps = {
  parts: FieldParts
  description?: string | undefined
}

export const FieldNotes = ({ parts, description }: FieldNotesProps) => (
  <>
    {description !== undefined && description !== '' && (
      <FieldDescription id={parts.descriptionId}>{description}</FieldDescription>
    )}
    {parts.isErrorDue && (
      <FieldError id={parts.errorId} errors={parts.errors.map((message) => ({ message }))} />
    )}
  </>
)
