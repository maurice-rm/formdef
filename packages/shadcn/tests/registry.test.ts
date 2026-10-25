import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import { conventionProblems } from './checks/convention-problems'
import { dependencyProblems } from './checks/dependency-problems'
import { landingProblems } from './checks/landing-problems'
import type { RegistryItem } from './checks/registry-item'

const ROOT = join(import.meta.dirname, '..')

const registry = JSON.parse(readFileSync(join(ROOT, 'registry.json'), 'utf8')) as {
  items: RegistryItem[]
}

const corePackage = JSON.parse(readFileSync(join(ROOT, '../core/package.json'), 'utf8')) as {
  peerDependencies: Record<string, string>
}

const readFile = (path: string): string => readFileSync(join(ROOT, path), 'utf8')

describe.each(registry.items.map((item) => [item.name, item] as const))('%s', (_name, item) => {
  it('lands every file where it is written, in a formdef folder', () => {
    expect(landingProblems(item)).toEqual([])
  })

  it('declares exactly what its files import', () => {
    expect(dependencyProblems(item, { readFile, peers: corePackage.peerDependencies })).toEqual([])
  })

  it('ships files without any, directives or comments', () => {
    expect(item.files.flatMap((file) => conventionProblems(file, readFile(file.path)))).toEqual([])
  })
})
