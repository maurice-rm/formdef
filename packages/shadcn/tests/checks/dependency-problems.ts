import { posix } from 'node:path'

import { importsOf } from './imports-of'
import type { RegistryItem } from './registry-item'

type DependencyInput = {
  /** Reads a shipped file by its path in this package. */
  readFile: (path: string) => string
  /** The peer dependencies of `@formdef/core`, whose ranges a shipped item repeats. */
  peers: Readonly<Record<string, string>>
}

const UI = '@/components/ui/'
const LOCAL = '@/'

// Every shadcn project depends on React already.
const PROVIDED = new Set(['react', 'react-dom'])

const SOURCE_EXTENSION = /\.tsx?$/

const packageOf = (specifier: string): string =>
  specifier
    .split('/')
    .slice(0, specifier.startsWith('@') ? 2 : 1)
    .join('/')

const splitDeclaration = (declaration: string): { name: string; range: string | undefined } => {
  const at = declaration.indexOf('@', 1)

  return at === -1
    ? { name: declaration, range: undefined }
    : { name: declaration.slice(0, at), range: declaration.slice(at + 1) }
}

const withoutExtension = (path: string): string => path.replace(SOURCE_EXTENSION, '')

const localPathOf = (specifier: string, importer: string): string =>
  specifier.startsWith(LOCAL)
    ? specifier.slice(LOCAL.length)
    : posix.join(posix.dirname(importer), specifier)

const difference = (left: Iterable<string>, right: ReadonlySet<string>): string[] =>
  [...new Set(left)].filter((entry) => !right.has(entry))

/**
 * What `item` declares wrongly: an npm package, shadcn primitive or local file its files import
 * without declaring or shipping it, one it declares without importing it, or a peer of the core
 * declared without the core's range.
 */
export function dependencyProblems(
  item: RegistryItem,
  { readFile, peers }: DependencyInput,
): string[] {
  const imports = item.files.flatMap((file) =>
    importsOf(readFile(file.path)).map((specifier) => ({ specifier, importer: file.path })),
  )
  const shipped = new Set(item.files.map((file) => withoutExtension(file.path)))
  const declared = (item.dependencies ?? []).map(splitDeclaration)
  const declaredNames = new Set(declared.map(({ name }) => name))
  const primitives = new Set(item.registryDependencies ?? [])

  const packages = imports
    .filter(({ specifier }) => !(specifier.startsWith(LOCAL) || specifier.startsWith('.')))
    .map(({ specifier }) => packageOf(specifier))
    .filter((name) => !PROVIDED.has(name))
  const usedPrimitives = imports
    .filter(({ specifier }) => specifier.startsWith(UI))
    .map(({ specifier }) => specifier.slice(UI.length))
  const unshipped = imports.filter(({ specifier, importer }) => {
    const isLocal =
      specifier.startsWith('.') || (specifier.startsWith(LOCAL) && !specifier.startsWith(UI))
    const path = localPathOf(specifier, importer)

    return isLocal && !(shipped.has(path) || shipped.has(`${path}/index`))
  })

  return [
    ...difference(packages, declaredNames).map(
      (name) => `${item.name} imports ${name} without declaring it in dependencies`,
    ),
    ...difference(declaredNames, new Set(packages)).map(
      (name) => `${item.name} declares ${name} in dependencies without importing it`,
    ),
    ...declared
      .filter(
        ({ name, range }) =>
          peers[name] !== undefined && !PROVIDED.has(name) && range !== peers[name],
      )
      .map(({ name }) => `${item.name} declares ${name} without the core's range ${peers[name]}`),
    ...difference(usedPrimitives, primitives).map(
      (name) => `${item.name} imports ${name} without declaring it in registryDependencies`,
    ),
    ...difference(primitives, new Set(usedPrimitives)).map(
      (name) => `${item.name} declares ${name} in registryDependencies without importing it`,
    ),
    ...unshipped.map(
      ({ specifier }) => `${item.name} imports ${specifier} without shipping it in files`,
    ),
  ]
}
