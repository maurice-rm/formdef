import { createGetUrl } from 'fumadocs-core/source'

const DOCS_IMAGE_ROUTE = '/og/docs'
const IMAGE_FILE = 'image.png'

const getImageUrl = createGetUrl(DOCS_IMAGE_ROUTE)

export function pageImageUrl(page: { slugs: string[] }): { segments: string[]; url: string } {
  const segments = [...page.slugs, IMAGE_FILE]

  return { segments, url: getImageUrl(segments) }
}
