import type { ReactNode } from 'react'

export type DescriptionPosition = 'beforeControl' | 'afterControl'

export type FieldLabels = {
  label?: string | undefined
  labelAside?: ReactNode
  description?: string | undefined
  descriptionPosition?: DescriptionPosition | undefined
}

const LABEL_SUFFIX = '-label'

export const labelIdFor = (controlId: string): string => `${controlId}${LABEL_SUFFIX}`
