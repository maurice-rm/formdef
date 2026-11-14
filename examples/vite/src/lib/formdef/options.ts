export type Option = {
  value: string
  label: string
  disabled?: boolean | undefined
  description?: string | undefined
}

export const optionId = (controlId: string, value: string): string =>
  `${controlId}-option-${encodeURIComponent(value)}`
