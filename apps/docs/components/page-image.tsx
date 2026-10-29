import type { ReactNode } from 'react'

import { BrandCanvas } from '@/components/brand-canvas'
import { BrandWordmark } from '@/components/brand-wordmark'
import { type BrandTheme, brandPalettes } from '@/lib/brand-palette'

const THEME: BrandTheme = 'dark'
const PADDING = 72
const WORDMARK_SIZE = 44
const TITLE_SIZE = 68
const TITLE_TRACKING = '-0.03em'
const TITLE_LINE_HEIGHT = 1.05
const DESCRIPTION_SIZE = 30
const DESCRIPTION_LINE_HEIGHT = 1.35
const TEXT_GAP = 20
const TEXT_MAX_WIDTH = 900
const GLOW_AT = '15% 120%'

type PageImageProps = {
  title: string
  description: string
}

export const PageImage = ({ title, description }: PageImageProps): ReactNode => (
  <BrandCanvas
    theme={THEME}
    glowAt={GLOW_AT}
    contentStyle={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: PADDING,
    }}
  >
    <BrandWordmark fontSize={WORDMARK_SIZE} />
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: TEXT_GAP, maxWidth: TEXT_MAX_WIDTH }}
    >
      <div
        style={{
          fontSize: TITLE_SIZE,
          fontWeight: 700,
          letterSpacing: TITLE_TRACKING,
          lineHeight: TITLE_LINE_HEIGHT,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: DESCRIPTION_SIZE,
          fontWeight: 500,
          lineHeight: DESCRIPTION_LINE_HEIGHT,
          color: brandPalettes[THEME].muted,
        }}
      >
        {description}
      </div>
    </div>
  </BrandCanvas>
)
