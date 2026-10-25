import type { RowProps } from '@formdef/core'
import { cn } from 'cn'

type RowFrameProps = RowProps & {
  className?: string | undefined
}

export const Row = ({ children, className }: RowFrameProps) => (
  <div className="@container/field-row w-full">
    <div
      data-slot="field-row"
      className={cn('flex flex-col gap-4 @md/field-row:flex-row @md/field-row:*:flex-1', className)}
    >
      {children}
    </div>
  </div>
)
