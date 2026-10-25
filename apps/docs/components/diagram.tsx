import Image from 'next/image'
import type { ReactNode } from 'react'

type DiagramProps = {
  /** The file name in `public/diagrams`, without the `-light.svg` or `-dark.svg` suffix. */
  name: string
  alt: string
  width: number
  height: number
}

const DIAGRAM_FOLDER = '/diagrams'

export const Diagram = ({ name, alt, width, height }: DiagramProps): ReactNode => (
  <figure className="not-prose my-6 overflow-x-auto">
    <Image
      src={`${DIAGRAM_FOLDER}/${name}-light.svg`}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      className="h-auto w-full min-w-160 dark:hidden"
    />
    <Image
      src={`${DIAGRAM_FOLDER}/${name}-dark.svg`}
      alt={alt}
      width={width}
      height={height}
      unoptimized
      className="hidden h-auto w-full min-w-160 dark:block"
    />
  </figure>
)
