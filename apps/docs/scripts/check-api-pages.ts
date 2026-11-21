import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import { apiPageOf, readExports } from '../lib/package-exports.ts'

const CORE_API_PAGES = join(import.meta.dirname, '../content/docs/api')
const DOCUMENT_API_PAGES = join(import.meta.dirname, '../content/docs/documents/api')
const PAGE_EXTENSION = '.mdx'
const SECTION_INDEX = 'index'

const pagesIn = (directory: string): Set<string> =>
  new Set(
    readdirSync(directory)
      .filter((file) => file.endsWith(PAGE_EXTENSION))
      .map((file) => file.slice(0, -PAGE_EXTENSION.length))
      .filter((page) => page !== SECTION_INDEX),
  )

// Every export of the core has a page; `@formdef/document` gives pages to the types a builder
// works with, and its guides describe the rest.
const coreExpected = new Set([...readExports('core').keys()].map(apiPageOf))
const coreWritten = pagesIn(CORE_API_PAGES)
const documentExports = new Set([...readExports('document').keys()].map(apiPageOf))
const documentWritten = pagesIn(DOCUMENT_API_PAGES)

const problems = [
  ...[...coreExpected]
    .filter((page) => !coreWritten.has(page))
    .map((page) => `An export of @formdef/core has no page: content/docs/api/${page}.mdx`),
  ...[...coreWritten]
    .filter((page) => !coreExpected.has(page))
    .map((page) => `A page describes no export of @formdef/core: content/docs/api/${page}.mdx`),
  ...[...documentWritten]
    .filter((page) => !documentExports.has(page))
    .map(
      (page) =>
        `A page describes no export of @formdef/document: content/docs/documents/api/${page}.mdx`,
    ),
]

if (problems.length > 0) {
  console.error(problems.join('\n'))
  process.exit(1)
}
