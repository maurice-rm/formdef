import { register } from 'fumadocs-mdx/node'
import { type FileObject, printErrors, scanURLs, validateFiles } from 'next-validate-link'

register()

const { source } = await import('../lib/source.ts')

type Page = ReturnType<typeof source.getPages>[number]

const headingsOf = (page: Page): string[] => page.data.toc.map((item) => item.url.slice(1))

const filesOf = (pages: Page[]): Promise<FileObject[]> =>
  Promise.all(
    pages.map(async (page) => ({
      path: page.absolutePath ?? page.path,
      content: await page.data.getText('raw'),
      url: page.url,
      data: page.data,
    })),
  )

const pages = source.getPages()
const scanned = await scanURLs({
  preset: 'next',
  populate: {
    '(docs)/[[...slug]]': pages.map((page) => ({
      value: { slug: page.slugs },
      hashes: headingsOf(page),
    })),
  },
})

printErrors(
  await validateFiles(await filesOf(pages), {
    scanned,
    markdown: { components: { Card: { attributes: ['href'] } } },
    checkRelativePaths: 'as-url',
  }),
  true,
)
