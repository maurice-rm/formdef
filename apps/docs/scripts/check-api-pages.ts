import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import { apiPageOf, readCoreExports } from '../lib/core-exports.ts'

const API_PAGES = join(import.meta.dirname, '../content/docs/api')
const PAGE_EXTENSION = '.mdx'
const SECTION_INDEX = 'index'

const expected = new Set([...readCoreExports().keys()].map(apiPageOf))
const written = new Set(
  readdirSync(API_PAGES)
    .filter((file) => file.endsWith(PAGE_EXTENSION))
    .map((file) => file.slice(0, -PAGE_EXTENSION.length))
    .filter((page) => page !== SECTION_INDEX),
)

const missing = [...expected].filter((page) => !written.has(page))
const stale = [...written].filter((page) => !expected.has(page))

if (missing.length > 0 || stale.length > 0) {
  console.error(
    [
      ...missing.map(
        (page) => `An export of @formdef/core has no page: content/docs/api/${page}.mdx`,
      ),
      ...stale.map(
        (page) => `A page describes no export of @formdef/core: content/docs/api/${page}.mdx`,
      ),
    ].join('\n'),
  )
  process.exit(1)
}
