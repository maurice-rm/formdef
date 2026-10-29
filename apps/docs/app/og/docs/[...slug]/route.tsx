import { notFound } from 'next/navigation'
import { ImageResponse } from 'takumi-js/response'

import { PageImage } from '@/components/page-image'
import { pageImageUrl } from '@/lib/page-image-url'
import { source } from '@/lib/source'

export const revalidate = false

const IMAGE_WIDTH = 1200
const IMAGE_HEIGHT = 630

export async function GET(
  _request: Request,
  { params }: RouteContext<'/og/docs/[...slug]'>,
): Promise<Response> {
  const { slug } = await params
  const page = source.getPage(slug.slice(0, -1))
  if (page === undefined) {
    notFound()
  }

  return new ImageResponse(
    <PageImage title={page.data.title} description={page.data.description ?? ''} />,
    { width: IMAGE_WIDTH, height: IMAGE_HEIGHT },
  )
}

export function generateStaticParams(): { slug: string[] }[] {
  return source.getPages().map((page) => ({ slug: pageImageUrl(page).segments }))
}
