import type { MetadataRoute } from 'next'

import { siteUrl } from '@/lib/site-url'

const SITEMAP_PATH = '/sitemap.xml'

export const revalidate = false

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: new URL(SITEMAP_PATH, siteUrl).href,
  }
}
