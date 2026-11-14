import type { ComponentProps, ReactNode } from 'react'

import { LabelText } from '@/components/formdef/label-text'
import { FieldLabel } from '@/components/ui/field'

type LabelLineProps = Pick<ComponentProps<typeof FieldLabel>, 'className' | 'htmlFor' | 'id'> & {
  children: ReactNode
  aside?: ReactNode
  required?: boolean | undefined
}

export const LabelLine = ({ children, aside, required, ...attrs }: LabelLineProps) => {
  const label = (
    <FieldLabel {...attrs}>
      <LabelText required={required}>{children}</LabelText>
    </FieldLabel>
  )

  return aside === undefined ? (
    label
  ) : (
    <div className="flex items-center justify-between gap-2">
      {label}
      {aside}
    </div>
  )
}
