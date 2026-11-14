import type { ReactNode } from 'react'

type LabelTextProps = {
  children: ReactNode
  required?: boolean | undefined
}

export const LabelText = ({ children, required }: LabelTextProps) =>
  required === true ? (
    <span data-required="" className="after:ms-0.5 after:text-destructive after:content-['*'_/_'']">
      {children}
    </span>
  ) : (
    children
  )
