import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/** A package whose exports the documentation shows with their TSDoc. */
export type DocumentedPackage = 'core' | 'document'

const PACKAGES = join(process.cwd(), '../../packages')
const SOURCE_EXTENSION = '.ts'

const EXPORT_LIST = /^export (?:type )?\{([^}]+)\} from '\.\/([^']+)'/gm
const INLINE_TYPE = /^type\s+/
const WORD_START = /(?<=[a-z])(?=[A-Z])/g

/** Where the pages of a package's exports live, below the documentation's root. */
export const API_ROUTES: Readonly<Record<DocumentedPackage, string>> = {
  core: '/api',
  document: '/documents/api',
}

/** Every export of a formdef package, by name, with the source file that declares it. */
export const readExports = (documented: DocumentedPackage): Map<string, string> => {
  const source = join(PACKAGES, documented, 'src')
  return new Map(
    [...readFileSync(join(source, 'index.ts'), 'utf8').matchAll(EXPORT_LIST)].flatMap(
      ([, names = '', file = '']) =>
        names
          .split(',')
          .map((name) => name.trim().replace(INLINE_TYPE, ''))
          // A list the formatter breaks over lines ends in a comma.
          .filter((name) => name !== '')
          .map((name) => [name, join(source, `${file}${SOURCE_EXTENSION}`)] as const),
    ),
  )
}

/** The name of an export's page: `createRegistry` and `CreateRegistry` alike become `create-registry`. */
export const apiPageOf = (exportName: string): string =>
  exportName.replace(WORD_START, '-').toLowerCase()
