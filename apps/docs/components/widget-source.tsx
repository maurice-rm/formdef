import { extname } from 'node:path'
import {
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
} from 'fumadocs-ui/components/codeblock'
import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc'
import type { ReactNode } from 'react'

import { CODE_THEMES } from '@/lib/code-themes'
import { readItemFiles } from '@/lib/registry-files'

type WidgetSourceProps = {
  /** The shadcn registry item, as `shadcn add @formdef/<name>` names it. */
  name: string
}

const languageOf = (path: string): string => extname(path).slice(1)

/** The files `shadcn add` installs for a shadcn registry item, one tab per file. */
export const WidgetSource = async ({ name }: WidgetSourceProps): Promise<ReactNode> => {
  const files = await readItemFiles(name)

  return (
    <CodeBlockTabs defaultValue={files[0]?.target}>
      <CodeBlockTabsList>
        {files.map((file) => (
          <CodeBlockTabsTrigger key={file.target} value={file.target}>
            {file.target}
          </CodeBlockTabsTrigger>
        ))}
      </CodeBlockTabsList>
      {files.map((file) => (
        <CodeBlockTab key={file.target} value={file.target}>
          <ServerCodeBlock code={file.source} lang={languageOf(file.target)} themes={CODE_THEMES} />
        </CodeBlockTab>
      ))}
    </CodeBlockTabs>
  )
}
