import type { BrandTheme } from './brand-palette'

export const BRAND_IMAGE_ROUTE = 'brand'

export type BrandImage = {
  width: number
  height: number
  theme: BrandTheme
}

// The README banner renders at twice its displayed size, so it stays sharp on dense screens.
export const brandImages: Record<string, BrandImage> = {
  'banner-light.png': { width: 2560, height: 800, theme: 'light' },
  'banner-dark.png': { width: 2560, height: 800, theme: 'dark' },
  'social.png': { width: 1280, height: 640, theme: 'dark' },
}
