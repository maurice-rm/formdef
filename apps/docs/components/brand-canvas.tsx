import type { CSSProperties, ReactNode } from 'react'

import { BRAND_GLOW, type BrandTheme, brandPalettes } from '@/lib/brand-palette'

const GLOW_ELLIPSE_SIZE = '45% 70%'
const GLOW_FADE_STOP = '70%'

type BrandCanvasProps = {
  theme: BrandTheme
  glowAt: string
  contentStyle: CSSProperties
  children: ReactNode
}

export const BrandCanvas = ({
  theme,
  glowAt,
  contentStyle,
  children,
}: BrandCanvasProps): ReactNode => {
  const palette = brandPalettes[theme]

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        backgroundColor: palette.background,
        backgroundImage: `radial-gradient(ellipse ${GLOW_ELLIPSE_SIZE} at ${glowAt}, ${BRAND_GLOW}, transparent ${GLOW_FADE_STOP})`,
        color: palette.foreground,
        fontFamily: 'Geist',
      }}
    >
      <div style={{ width: '100%', height: '100%', ...contentStyle }}>{children}</div>
    </div>
  )
}
