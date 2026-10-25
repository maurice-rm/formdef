import type { RegistryItem } from './registry-item'

const ALIAS = /^@(components|lib|hooks)\//

/**
 * Where the files of `item` would land wrongly: without a target, outside a `formdef/` folder, or
 * at a target that differs from the file's path here, which breaks the CLI's import rewriting.
 */
export const landingProblems = (item: RegistryItem): string[] =>
  item.files.flatMap((file) => {
    if (file.target === undefined) {
      return [`${item.name}: ${file.path} has no target`]
    }
    if (!ALIAS.test(file.target)) {
      return [`${item.name}: ${file.path} lands outside an alias of the project`]
    }
    if (!file.path.split('/').includes('formdef')) {
      return [`${item.name}: ${file.path} lies outside a formdef folder`]
    }
    if (file.target.replace(ALIAS, '$1/') !== file.path) {
      return [`${item.name}: ${file.path} lands at ${file.target}`]
    }

    return []
  })
