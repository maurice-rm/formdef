import { notFound } from 'next/navigation'
import { ImageResponse } from 'takumi-js/response'

import { BrandBanner } from '@/components/brand-banner'
import { brandImages } from '@/lib/brand-images'

export const revalidate = false

export async function GET(
  _request: Request,
  { params }: RouteContext<'/brand/[image]'>,
): Promise<Response> {
  const { image } = await params
  const brandImage = brandImages[image]
  if (brandImage === undefined) {
    notFound()
  }

  return new ImageResponse(<BrandBanner {...brandImage} />, {
    width: brandImage.width,
    height: brandImage.height,
  })
}

export function generateStaticParams(): { image: string }[] {
  return Object.keys(brandImages).map((image) => ({ image }))
}
