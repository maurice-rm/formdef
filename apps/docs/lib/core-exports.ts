import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const CORE_SOURCE = join(process.cwd(), '../../packages/core/src')
const SOURCE_EXTENSION = '.ts'

const EXPORT_LIST = /^export (?:type )?\{([^}]+)\} from '\.\/([^']+)'/gm
const WORD_START = /(?<=[a-z])(?=[A-Z])/g

/** Every export of `@formdef/core`, by name, with the source file that declares it. */
export const readCoreExports = (): Map<string, string> =>
  new Map(
    [...readFileSync(join(CORE_SOURCE, 'index.ts'), 'utf8').matchAll(EXPORT_LIST)].flatMap(
      ([, names = '', file = '']) =>
        names
          .split(',')
          .map((name) => [name.trim(), join(CORE_SOURCE, `${file}${SOURCE_EXTENSION}`)] as const),
    ),
  )

/** The name of an export's page under `/api`: `createRegistry` and `CreateRegistry` alike become `create-registry`. */
export const apiPageOf = (exportName: string): string =>
  exportName.replace(WORD_START, '-').toLowerCase()
