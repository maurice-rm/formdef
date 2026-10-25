import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { register } from 'fumadocs-mdx/node'

register()

const { source } = await import('../lib/source.ts')

const OUT_DIR = join(import.meta.dirname, '../out')

const CHECKED_FENCE = /^```(?:ts|tsx)\b[^\n]*\n([\s\S]*?)^```/gm
const EXPECTED_ERRORS = /^\/\/ @errors:/m
const RENDERED_BLOCK = /<pre\b[\s\S]*?<\/pre>/g
const RENDERED_ERROR = 'twoslash-error-line'

type Page = ReturnType<typeof source.getPages>[number]

const countExpected = (raw: string): number =>
  [...raw.matchAll(CHECKED_FENCE)].filter(([, code]) => EXPECTED_ERRORS.test(code ?? '')).length

const countRendered = (html: string): number =>
  [...html.matchAll(RENDERED_BLOCK)].filter(([block]) => block.includes(RENDERED_ERROR)).length

const htmlPathOf = (page: Page): string =>
  join(OUT_DIR, page.url === '/' ? 'index.html' : `${page.url.slice(1)}.html`)

const problemOf = async (page: Page): Promise<string | undefined> => {
  const expected = countExpected(await page.data.getText('raw'))
  const rendered = countRendered(await readFile(htmlPathOf(page), 'utf8'))
  if (expected === rendered) {
    return undefined
  }

  return `${page.url}: examples announced with // @errors: ${expected}, rendered with an error: ${rendered}`
}

const problems = (await Promise.all(source.getPages().map(problemOf))).filter(
  (problem) => problem !== undefined,
)

if (problems.length > 0) {
  console.error(`An example that should not compile does, or the reverse:\n${problems.join('\n')}`)
  process.exit(1)
}
