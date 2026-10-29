export type BrandTheme = 'light' | 'dark'

export type BrandPalette = {
  background: string
  foreground: string
  muted: string
}

// The site's --brand in app/global.css; Takumi renders without CSS, so the colour is repeated here.
export const BRAND_COLOR = '#ff6900'
export const BRAND_GLOW = 'rgba(255, 105, 0, 0.22)'

export const brandPalettes: Record<BrandTheme, BrandPalette> = {
  light: { background: '#fafafa', foreground: '#0a0a0a', muted: '#5c5c5c' },
  dark: { background: '#0a0a0a', foreground: '#fafafa', muted: '#a1a1a1' },
}
