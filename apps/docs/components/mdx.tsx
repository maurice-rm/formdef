import * as Twoslash from 'fumadocs-twoslash/ui'
import { createFileSystemGeneratorCache, createGenerator } from 'fumadocs-typescript'
import { AutoTypeTable, type AutoTypeTableProps } from 'fumadocs-typescript/ui'
import * as StepsComponents from 'fumadocs-ui/components/steps'
import * as TabsComponents from 'fumadocs-ui/components/tabs'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { MDXComponents } from 'mdx/types'
import type { ReactNode } from 'react'

import { BuildingBlocksDiagram } from './diagrams/building-blocks'
import { RenderLoopDiagram } from './diagrams/render-loop'
import { RegistryConfig } from './registry-config'
import { WidgetPreview } from './widget-preview'
import { WidgetSource } from './widget-source'

const generator = createGenerator({
  cache: createFileSystemGeneratorCache('.next/fumadocs-typescript'),
})

const GeneratedTypeTable = (props: Partial<AutoTypeTableProps>): ReactNode => (
  <AutoTypeTable {...props} generator={generator} />
)

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    ...StepsComponents,
    ...TabsComponents,
    ...Twoslash,
    AutoTypeTable: GeneratedTypeTable,
    BuildingBlocksDiagram,
    RenderLoopDiagram,
    RegistryConfig,
    WidgetPreview,
    WidgetSource,
    ...components,
  }
}
