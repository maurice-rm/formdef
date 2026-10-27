import type { ReactNode } from 'react'

import { appName } from '@/lib/app-name'

type BrandNameProps = {
  className?: string
}

const BRAND_NAME_CLASSES = 'font-bold font-brand text-xl tracking-tight'

export function BrandName({ className }: BrandNameProps): ReactNode {
  return (
    <span
      className={
        className === undefined ? BRAND_NAME_CLASSES : `${BRAND_NAME_CLASSES} ${className}`
      }
    >
      {appName}
      <span className="text-brand" aria-hidden>
        .
      </span>
    </span>
  )
}
