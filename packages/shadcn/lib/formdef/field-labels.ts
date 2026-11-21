import type { ReactNode } from 'react'

export type DescriptionPosition = 'beforeControl' | 'afterControl'

export type FieldLabels = {
  label?: string | undefined
  labelAside?: ReactNode
  description?: ReactNode
  descriptionPosition?: DescriptionPosition | undefined
}

const LABEL_SUFFIX = '-label'

export const hasDescription = (description: ReactNode): boolean =>
  description !== undefined &&
  description !== null &&
  typeof description !== 'boolean' &&
  description !== ''

export const labelIdFor = (controlId: string): string => `${controlId}${LABEL_SUFFIX}`
