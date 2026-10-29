import type { ReactNode } from 'react'

import { BrandCanvas } from '@/components/brand-canvas'
import { BrandWordmark } from '@/components/brand-wordmark'
import type { BrandImage } from '@/lib/brand-images'
import { BRAND_COLOR, brandPalettes } from '@/lib/brand-palette'

const TAGLINE = 'Describe a form once. Render it as a React component.'
const FACTS = ['Type-checked widgets', 'Built on TanStack Form', 'Bring your own components']

const DESIGN_WIDTH = 1280
const WORDMARK_SIZE = 141
const TAGLINE_SIZE = 27.5
const TAGLINE_TRACKING = '-0.01em'
const FACT_SIZE = 18.5
const FACT_GAP = 22
const CHECK_SIZE = 15
const CHECK_GAP = 6
const CHECK_STROKE = 3
const WORDMARK_GAP = 28
const TAGLINE_GAP = 19
const GLOW_AT = '50% 115%'
const TALL_RATIO = 0.5
const TALL_SCALE = 1.2

type CheckProps = {
  size: number
}

const Check = ({ size }: CheckProps): ReactNode => (
  <svg
    aria-hidden
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={BRAND_COLOR}
    strokeWidth={CHECK_STROKE}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
)

type BrandBannerProps = BrandImage

export const BrandBanner = ({ width, height, theme }: BrandBannerProps): ReactNode => {
  const isTall = height / width >= TALL_RATIO
  const scale = (width / DESIGN_WIDTH) * (isTall ? TALL_SCALE : 1)
  const size = (value: number): number => Math.round(value * scale)
  const muted = brandPalettes[theme].muted

  return (
    <BrandCanvas
      theme={theme}
      glowAt={GLOW_AT}
      contentStyle={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <BrandWordmark fontSize={size(WORDMARK_SIZE)} />
      <div
        style={{
          marginTop: size(WORDMARK_GAP),
          fontSize: size(TAGLINE_SIZE),
          fontWeight: 500,
          letterSpacing: TAGLINE_TRACKING,
          color: muted,
        }}
      >
        {TAGLINE}
      </div>
      <div
        style={{
          display: 'flex',
          gap: size(FACT_GAP),
          marginTop: size(TAGLINE_GAP),
          fontSize: size(FACT_SIZE),
          fontWeight: 500,
          color: muted,
        }}
      >
        {FACTS.map((fact) => (
          <div key={fact} style={{ display: 'flex', alignItems: 'center', gap: size(CHECK_GAP) }}>
            <Check size={size(CHECK_SIZE)} />
            {fact}
          </div>
        ))}
      </div>
    </BrandCanvas>
  )
}
