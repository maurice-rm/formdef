import type { ComponentProps, ReactNode } from 'react'

import { FieldLabel } from '@/components/ui/field'

type LabelLineProps = Pick<ComponentProps<typeof FieldLabel>, 'className' | 'htmlFor' | 'id'> & {
  children: ReactNode
  aside?: ReactNode
}

export const LabelLine = ({ children, aside, ...attrs }: LabelLineProps) =>
  aside === undefined ? (
    <FieldLabel {...attrs}>{children}</FieldLabel>
  ) : (
    <div className="flex items-center justify-between gap-2">
      <FieldLabel {...attrs}>{children}</FieldLabel>
      {aside}
    </div>
  )
