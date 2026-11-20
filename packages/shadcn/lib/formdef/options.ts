import type { ReactNode } from 'react'

export type Option = {
  value: string
  label: string
  disabled?: boolean | undefined
  description?: ReactNode
}

export const optionId = (controlId: string, value: string): string =>
  `${controlId}-option-${encodeURIComponent(value)}`
