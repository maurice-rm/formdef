import { createShikiHighlighter } from 'fumadocs-core/highlight/shiki'
import { defaultShikiFactory } from 'fumadocs-core/highlight/shiki/full'
import * as Twoslash from 'fumadocs-twoslash/ui'
import { createFileSystemGeneratorCache, createGenerator } from 'fumadocs-typescript'
import { AutoTypeTable, type AutoTypeTableProps } from 'fumadocs-typescript/ui'
import * as StepsComponents from 'fumadocs-ui/components/steps'
import * as TabsComponents from 'fumadocs-ui/components/tabs'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import type { ReactNode } from 'react'

import { CODE_THEMES } from '@/lib/code-themes'

import { ApiDoc } from './api-doc'
import { BuildingBlocksDiagram } from './diagrams/building-blocks'
import { RenderLoopDiagram } from './diagrams/render-loop'
import { RegistryConfig } from './registry-config'
import { WidgetPreview } from './widget-preview'
import { WidgetSource } from './widget-source'

const generator = createGenerator({
  cache: createFileSystemGeneratorCache('.next/fumadocs-typescript'),
})

const typeHighlighter = createShikiHighlighter(() => defaultShikiFactory.getOrInit(), {
  themes: CODE_THEMES,
  defaultColor: false,
})

const GeneratedTypeTable = (props: Partial<AutoTypeTableProps>): ReactNode => (
  <AutoTypeTable {...props} generator={generator} highlighter={typeHighlighter} />
)

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...StepsComponents,
    ...TabsComponents,
    ...Twoslash,
    ApiDoc,
    AutoTypeTable: GeneratedTypeTable,
    BuildingBlocksDiagram,
    RenderLoopDiagram,
    RegistryConfig,
    WidgetPreview,
    WidgetSource,
    ...components,
  }
}
