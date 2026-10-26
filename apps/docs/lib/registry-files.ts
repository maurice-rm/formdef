import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

const SHADCN_PACKAGE = join(process.cwd(), '../../packages/shadcn')
const TARGET_ALIAS = '@'
const COMPONENT_EXTENSION = '.tsx'

type RegistryFile = { path: string; target: string }
type RegistryItem = { name: string; files: RegistryFile[] }

/** A file of a shadcn registry item: where `shadcn add` writes it, and its source. */
export type ItemFile = { target: string; source: string }

const readRegistry = async (): Promise<RegistryItem[]> => {
  const registry = await readFile(join(SHADCN_PACKAGE, 'registry.json'), 'utf8')

  return (JSON.parse(registry) as { items: RegistryItem[] }).items
}

const isMainFileOf = (name: string, file: RegistryFile): boolean =>
  basename(file.path) === `${name}${COMPONENT_EXTENSION}`

const mainFileFirst = (name: string, files: RegistryFile[]): RegistryFile[] => [
  ...files.filter((file) => isMainFileOf(name, file)),
  ...files.filter((file) => !isMainFileOf(name, file)),
]

/**
 * Reads the files `shadcn add` installs for a shadcn registry item, the item's own component first.
 *
 * @throws When the shadcn registry has no item of that name.
 */
export const readItemFiles = async (name: string): Promise<ItemFile[]> => {
  const item = (await readRegistry()).find((candidate) => candidate.name === name)
  if (item === undefined) {
    throw new Error(`formdef: the shadcn registry has no item "${name}".`)
  }

  return Promise.all(
    mainFileFirst(name, item.files).map(async (file) => ({
      target: file.target.replace(TARGET_ALIAS, ''),
      source: await readFile(join(SHADCN_PACKAGE, file.path), 'utf8'),
    })),
  )
}
