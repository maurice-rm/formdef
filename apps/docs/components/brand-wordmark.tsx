import type { ReactNode } from 'react'

import { appName } from '@/lib/app-name'
import { BRAND_COLOR } from '@/lib/brand-palette'

const TRACKING = '-0.045em'
const LINE_HEIGHT = 0.9

type BrandWordmarkProps = {
  fontSize: number
}

/** The "formdef." wordmark for images rendered with Takumi; the documentation's own header uses `BrandName`. */
export const BrandWordmark = ({ fontSize }: BrandWordmarkProps): ReactNode => (
  <div style={{ fontSize, fontWeight: 800, letterSpacing: TRACKING, lineHeight: LINE_HEIGHT }}>
    {appName}
    <span style={{ color: BRAND_COLOR }}>.</span>
  </div>
)
