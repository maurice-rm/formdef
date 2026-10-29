import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { register } from 'fumadocs-mdx/node'

register()

const { pageImageUrl } = await import('../lib/page-image-url.ts')
const { LOCAL_URL } = await import('../lib/site-url.ts')
const { source } = await import('../lib/source.ts')

const OUT_DIR = join(import.meta.dirname, '../.image-preview')
const INDEX_FILE = 'index.html'

type PreviewImage = {
  page: string
  path: string
  file: string
}

const pageImages: PreviewImage[] = source.getPages().map((page) => {
  const { url } = pageImageUrl(page)
  return { page: page.url, path: url, file: url.slice(1).replaceAll('/', '-') }
})

const CONNECTION_REFUSED = 'ECONNREFUSED'

const isConnectionRefused = (error: unknown): boolean =>
  error instanceof Error &&
  error.cause instanceof Error &&
  'code' in error.cause &&
  error.cause.code === CONNECTION_REFUSED

const fetchImage = async (path: string): Promise<ArrayBuffer> => {
  const url = new URL(path, LOCAL_URL)
  let response: Response
  try {
    response = await fetch(url)
  } catch (error) {
    if (isConnectionRefused(error)) {
      throw new Error(
        `formdef: no documentation server at ${LOCAL_URL}; start it with pnpm --filter @formdef/docs dev`,
        { cause: error },
      )
    }
    throw new Error(`formdef: ${url} could not be fetched`, { cause: error })
  }
  if (!response.ok) {
    throw new Error(`formdef: ${url} answered ${response.status} ${response.statusText}`)
  }

  return response.arrayBuffer()
}

const indexHtml = (images: PreviewImage[]): string => `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<title>formdef images</title>
<style>
  body { margin: 0; padding: 32px; font-family: system-ui, sans-serif; background: #f4f4f5; }
  main { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 24px; }
  figure { margin: 0; }
  img { display: block; width: 100%; border-radius: 8px; }
  figcaption { margin-top: 8px; font-size: 14px; color: #52525b; }
</style>
<main>
${images.map(({ page, file }) => `<figure><img src="${file}" alt=""><figcaption>${page}</figcaption></figure>`).join('\n')}
</main>
</html>
`

const saveImages = async (): Promise<void> => {
  await rm(OUT_DIR, { recursive: true, force: true })
  await mkdir(OUT_DIR)
  for (const image of pageImages) {
    await writeFile(join(OUT_DIR, image.file), Buffer.from(await fetchImage(image.path)))
  }
  await writeFile(join(OUT_DIR, INDEX_FILE), indexHtml(pageImages))
}

try {
  await saveImages()
  console.log(`${pageImages.length} images in ${join(OUT_DIR, INDEX_FILE)}`)
} catch (error) {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
