import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/site-url'
import { source } from '@/lib/source'

export const revalidate = false

export default function sitemap(): MetadataRoute.Sitemap {
  return source.getPages().map((page) => ({ url: new URL(page.url, siteUrl).href }))
}
