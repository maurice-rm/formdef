import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import type { ReactNode } from 'react'

import { CODE_THEMES } from '@/lib/code-themes'
import { DateFieldPreview } from './previews/date-field'
import { TextFieldPreview } from './previews/text-field'

const PREVIEWS = {
  'text-field': TextFieldPreview,
  'date-field': DateFieldPreview,
}

const PREVIEW_SOURCES = join(process.cwd(), 'components/previews')
const PREVIEW_TAB = 'Preview'
const CODE_TAB = 'Code'

type WidgetPreviewProps = {
  /** The shadcn registry item the preview shows. */
  name: keyof typeof PREVIEWS
}

/** A live form built with a widget, next to the code that builds it. */
export const WidgetPreview = async ({ name }: WidgetPreviewProps): Promise<ReactNode> => {
  const Preview = PREVIEWS[name]
  const source = await readFile(join(PREVIEW_SOURCES, `${name}.tsx`), 'utf8')

  return (
    <Tabs items={[PREVIEW_TAB, CODE_TAB]}>
      <Tab value={PREVIEW_TAB}>
        <div className="widget-preview not-prose">
          <Preview />
        </div>
      </Tab>
      <Tab value={CODE_TAB}>
        <ServerCodeBlock code={source} lang="tsx" themes={CODE_THEMES} />
      </Tab>
    </Tabs>
  )
}
