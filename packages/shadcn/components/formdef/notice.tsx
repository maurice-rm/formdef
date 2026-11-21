import type { ComponentProps, ReactNode } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type NoticeProps = Pick<ComponentProps<typeof Alert>, 'variant' | 'className'> & {
  title?: string | undefined
  children: ReactNode
}

export const Notice = ({ title, children, ...attrs }: NoticeProps) => (
  <Alert {...attrs} role="note">
    {title !== undefined && title !== '' && <AlertTitle>{title}</AlertTitle>}
    <AlertDescription className="*:not-last:mb-2">{children}</AlertDescription>
  </Alert>
)
