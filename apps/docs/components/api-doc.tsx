import { Markdown, type MarkdownRendererOptions } from 'fumadocs-core/content/md'
import { rehypeCode, remarkGfm } from 'fumadocs-core/mdx-plugins'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import type { ReactNode } from 'react'

import { CODE_THEMES } from '@/lib/code-themes'
import { type NamedTag, readTsDoc } from '@/lib/tsdoc'

type ApiDocProps = {
  /** The export of `@formdef/core` whose TSDoc the page shows. */
  name: string
}

const REHYPE_PLUGINS: MarkdownRendererOptions['rehypePlugins'] = [
  [rehypeCode, { themes: CODE_THEMES }],
]
const REMARK_PLUGINS: MarkdownRendererOptions['remarkPlugins'] = [remarkGfm]

const Prose = ({ children }: { children: string }) => (
  <Markdown
    remarkPlugins={REMARK_PLUGINS}
    rehypePlugins={REHYPE_PLUGINS}
    components={defaultMdxComponents}
  >
    {children}
  </Markdown>
)

const tableOf = (heading: string, tags: NamedTag[]): string =>
  [
    `| ${heading} | Description |`,
    '| --- | --- |',
    ...tags.map(
      (tag) =>
        `| \`${tag.name}\` | ${tag.text.replaceAll('\n', ' ').replaceAll('|', String.raw`\|`)} |`,
    ),
  ].join('\n')

const listOf = (items: string[]): string =>
  items.map((item) => `- ${item.replaceAll('\n', ' ')}`).join('\n')

/** The TSDoc of an export of `@formdef/core`, read from its source: summary, type parameters, parameters, return value, errors, remarks and examples. */
export const ApiDoc = ({ name }: ApiDocProps): ReactNode => {
  const doc = readTsDoc(name)
  const sections = [
    doc.summary,
    doc.typeParams.length > 0 && `### Type parameters\n\n${tableOf('Name', doc.typeParams)}`,
    doc.params.length > 0 && `### Parameters\n\n${tableOf('Name', doc.params)}`,
    doc.defaultValues.length > 0 && `### Defaults\n\n${listOf(doc.defaultValues)}`,
    doc.returns !== undefined && `### Returns\n\n${doc.returns}`,
    doc.throws.length > 0 && `### Throws\n\n${listOf(doc.throws)}`,
    doc.remarks !== undefined && `### Remarks\n\n${doc.remarks}`,
    doc.examples.length > 0 && `### Example\n\n${doc.examples.join('\n\n')}`,
  ].filter((section) => typeof section === 'string')

  return <Prose>{sections.join('\n\n')}</Prose>
}
