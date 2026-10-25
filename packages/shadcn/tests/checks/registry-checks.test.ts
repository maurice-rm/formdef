import { describe, expect, it } from 'vitest'

import { conventionProblems } from './convention-problems'
import { dependencyProblems } from './dependency-problems'
import { landingProblems } from './landing-problems'
import type { RegistryItem } from './registry-item'

const PEERS = { '@tanstack/react-form': '>=1.33.5 <1.34.0', react: '^19.0.0' }

const SETUP_FILE = {
  path: 'lib/formdef/index.tsx',
  type: 'registry:lib',
  target: '@lib/formdef/index.tsx',
}

const item = (overrides: Partial<RegistryItem> = {}): RegistryItem => ({
  name: 'text-field',
  type: 'registry:component',
  dependencies: ['@formdef/core', 'cn'],
  registryDependencies: ['input'],
  files: [
    {
      path: 'components/formdef/text-field.tsx',
      type: 'registry:component',
      target: '@components/formdef/text-field.tsx',
    },
  ],
  ...overrides,
})

const SOURCE = [
  "import { fieldParts } from '@formdef/core'",
  "import { cn } from 'cn'",
  "import { Input } from '@/components/ui/input'",
].join('\n')

const sourceOf = (source: string) => (): string => source

describe('landingProblems', () => {
  it('accepts a file whose path is its target under a formdef folder', () => {
    expect(landingProblems(item())).toEqual([])
  })

  it('reports a file without a target', () => {
    const file = { path: 'components/formdef/text-field.tsx', type: 'registry:component' }

    expect(landingProblems(item({ files: [file] }))).toEqual([
      'text-field: components/formdef/text-field.tsx has no target',
    ])
  })

  it('reports a target that renames or moves the file', () => {
    const file = {
      path: 'components/formdef/text-field.tsx',
      type: 'registry:component',
      target: '@components/formdef/text-input.tsx',
    }

    expect(landingProblems(item({ files: [file] }))).toEqual([
      'text-field: components/formdef/text-field.tsx lands at @components/formdef/text-input.tsx',
    ])
  })

  it('reports a target outside the alias of the project', () => {
    const file = {
      path: 'components/formdef/text-field.tsx',
      type: 'registry:component',
      target: 'components/formdef/text-field.tsx',
    }

    expect(landingProblems(item({ files: [file] }))).toEqual([
      'text-field: components/formdef/text-field.tsx lands outside an alias of the project',
    ])
  })

  it('reports a file outside a formdef folder', () => {
    const file = {
      path: 'components/text-field.tsx',
      type: 'registry:component',
      target: '@components/text-field.tsx',
    }

    expect(landingProblems(item({ files: [file] }))).toEqual([
      'text-field: components/text-field.tsx lies outside a formdef folder',
    ])
  })
})

describe('dependencyProblems', () => {
  it('accepts an item that declares exactly what its files import', () => {
    expect(dependencyProblems(item(), { readFile: sourceOf(SOURCE), peers: PEERS })).toEqual([])
  })

  it('reports an npm import missing from dependencies', () => {
    const problems = dependencyProblems(item({ dependencies: ['@formdef/core'] }), {
      readFile: sourceOf(SOURCE),
      peers: PEERS,
    })

    expect(problems).toEqual(['text-field imports cn without declaring it in dependencies'])
  })

  it('reports a dependency no file imports', () => {
    const problems = dependencyProblems(item({ dependencies: ['@formdef/core', 'cn', 'clsx'] }), {
      readFile: sourceOf(SOURCE),
      peers: PEERS,
    })

    expect(problems).toEqual(['text-field declares clsx in dependencies without importing it'])
  })

  it('reports a shadcn primitive missing from registryDependencies, and one never imported', () => {
    const problems = dependencyProblems(item({ registryDependencies: ['label'] }), {
      readFile: sourceOf(SOURCE),
      peers: PEERS,
    })

    expect(problems).toEqual([
      'text-field imports input without declaring it in registryDependencies',
      'text-field declares label in registryDependencies without importing it',
    ])
  })

  it('reports a local import whose file the item does not ship', () => {
    const problems = dependencyProblems(item(), {
      readFile: sourceOf(`${SOURCE}\nimport { labelLine } from '@/components/formdef/label-line'`),
      peers: PEERS,
    })

    expect(problems).toEqual([
      'text-field imports @/components/formdef/label-line without shipping it in files',
    ])
  })

  it("reports a peer of the core declared without the core's range", () => {
    const tanstack = "import { useStore } from '@tanstack/react-form'"
    const problems = dependencyProblems(
      item({ dependencies: ['@formdef/core', 'cn', '@tanstack/react-form'] }),
      { readFile: sourceOf(`${SOURCE}\n${tanstack}`), peers: PEERS },
    )

    expect(problems).toEqual([
      "text-field declares @tanstack/react-form without the core's range >=1.33.5 <1.34.0",
    ])
  })

  it("accepts a peer of the core declared with the core's range", () => {
    const tanstack = "import { useStore } from '@tanstack/react-form'"
    const problems = dependencyProblems(
      item({ dependencies: ['@formdef/core', 'cn', '@tanstack/react-form@>=1.33.5 <1.34.0'] }),
      { readFile: sourceOf(`${SOURCE}\n${tanstack}`), peers: PEERS },
    )

    expect(problems).toEqual([])
  })

  it('needs no declaration for React, which every shadcn project has', () => {
    const problems = dependencyProblems(item(), {
      readFile: sourceOf(`${SOURCE}\nimport { useId } from 'react'`),
      peers: PEERS,
    })

    expect(problems).toEqual([])
  })
})

describe('conventionProblems', () => {
  const widget = item().files[0] as RegistryItem['files'][number]

  it('accepts a file without any, directives or comments', () => {
    expect(conventionProblems(widget, SOURCE)).toEqual([])
  })

  it.each([
    ['const value: any = 1', 'uses any'],
    ['const value = input as any', 'uses any'],
    ['const map: Record<string, any> = {}', 'uses any'],
    ['type Value = any', 'uses any'],
    ['type Value = string | any', 'uses any'],
    ['// @ts-expect-error\nconst value = 1', 'carries a directive'],
    ['// biome-ignore lint/style: reason\nconst value = 1', 'carries a directive'],
    ['/* eslint-disable */\nconst value = 1', 'carries a directive'],
    ['// explains the value\nconst value = 1', 'carries a comment'],
    ['/** explains the value */\nconst value = 1', 'carries a comment'],
  ])('reports %j', (source, problem) => {
    expect(conventionProblems(widget, source)).toEqual([
      `components/formdef/text-field.tsx ${problem}`,
    ])
  })

  it('lets a setup file explain itself in comments', () => {
    expect(conventionProblems(SETUP_FILE, '// add your widgets here\nconst value = 1')).toEqual([])
  })

  it.each([
    '// @ts-ignore\nconst value = 1',
    '/** @ts-expect-error */\nconst value = 1',
    '/// <reference types="node" />\nconst value = 1',
  ])('reports a directive in a setup file too: %j', (source) => {
    expect(conventionProblems(SETUP_FILE, source)).toEqual([
      'lib/formdef/index.tsx carries a directive',
    ])
  })

  it('does not take a URL or a word containing any for a problem', () => {
    expect(
      conventionProblems(widget, "const url = 'https://example.com'\nconst company = 1"),
    ).toEqual([])
  })
})
