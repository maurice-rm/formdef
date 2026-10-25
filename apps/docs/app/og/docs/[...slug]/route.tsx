import { generateOGImage } from 'fumadocs-ui/og'
import { notFound } from 'next/navigation'

import { appName } from '@/lib/app-name'
import { pageImageUrl } from '@/lib/page-image-url'
import { source } from '@/lib/source'

export const revalidate = false

export async function GET(
  _request: Request,
  { params }: RouteContext<'/og/docs/[...slug]'>,
): Promise<Response> {
  const { slug } = await params
  const page = source.getPage(slug.slice(0, -1))
  if (page === undefined) {
    notFound()
  }

  return generateOGImage({
    title: page.data.title,
    description: page.data.description,
    site: appName,
  })
}

export function generateStaticParams(): { slug: string[] }[] {
  return source.getPages().map((page) => ({ slug: pageImageUrl(page).segments }))
}
