import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { BRAND_IMAGE_ROUTE, type BrandImage, brandImages } from '../lib/brand-images.ts'

const OUT_DIR = join(import.meta.dirname, '../out')

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const WIDTH_OFFSET = 16
const HEIGHT_OFFSET = 20

const readImage = async (file: string): Promise<Buffer | undefined> => {
  try {
    return await readFile(join(OUT_DIR, BRAND_IMAGE_ROUTE, file))
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return undefined
    }
    throw error
  }
}

const problemOf = async ([file, { width, height }]: [string, BrandImage]): Promise<
  string | undefined
> => {
  const image = await readImage(file)
  if (image === undefined) {
    return `${file}: not exported`
  }
  if (!image.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    return `${file}: not a PNG`
  }

  const actual = {
    width: image.readUInt32BE(WIDTH_OFFSET),
    height: image.readUInt32BE(HEIGHT_OFFSET),
  }
  if (actual.width === width && actual.height === height) {
    return undefined
  }

  return `${file}: ${actual.width}×${actual.height}, expected ${width}×${height}`
}

const problems = (await Promise.all(Object.entries(brandImages).map(problemOf))).filter(
  (problem) => problem !== undefined,
)

if (problems.length > 0) {
  console.error(
    `The brand images, which the README and the social preview use, are not as expected:\n${problems.join('\n')}`,
  )
  process.exit(1)
}
