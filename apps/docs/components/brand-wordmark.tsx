import type { ReactNode } from 'react'

import { appName } from '@/lib/app-name'
import { BRAND_COLOR } from '@/lib/brand-palette'

const TRACKING = '-0.045em'
const LINE_HEIGHT = 0.9

type BrandWordmarkProps = {
  fontSize: number
}

export const BrandWordmark = ({ fontSize }: BrandWordmarkProps): ReactNode => (
  <div style={{ fontSize, fontWeight: 800, letterSpacing: TRACKING, lineHeight: LINE_HEIGHT }}>
    {appName}
    <span style={{ color: BRAND_COLOR }}>.</span>
  </div>
)
