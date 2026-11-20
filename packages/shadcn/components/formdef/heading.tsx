import { cn } from 'cn'
import type { ReactNode } from 'react'

type HeadingLevel = 2 | 3 | 4 | 5 | 6

type HeadingProps = {
  children: ReactNode
  level?: HeadingLevel | undefined
  className?: string | undefined
}

const BELOW_THE_STEP = 3

export const Heading = ({ children, level = BELOW_THE_STEP, className }: HeadingProps) => {
  const Tag = `h${level}` as const

  return (
    <Tag
      data-slot="heading"
      className={cn('font-heading text-base font-semibold not-first:pt-4', className)}
    >
      {children}
    </Tag>
  )
}
