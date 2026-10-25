import type { ComponentProps, ReactNode } from 'react'

import type { InputGroupAddon } from '@/components/ui/input-group'

export type Addon = {
  id: string
  content: ReactNode
  align?: ComponentProps<typeof InputGroupAddon>['align'] | undefined
}
