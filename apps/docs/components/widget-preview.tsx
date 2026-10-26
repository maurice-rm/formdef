import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc'
import { Tab, Tabs } from 'fumadocs-ui/components/tabs'
import type { ReactNode } from 'react'

import { CODE_THEMES } from '@/lib/code-themes'
import { ArrayFramePreview } from './previews/array-frame'
import { CheckboxFieldPreview } from './previews/checkbox-field'
import { CheckboxGroupFieldPreview } from './previews/checkbox-group-field'
import { ComboboxFieldPreview } from './previews/combobox-field'
import { DateFieldPreview } from './previews/date-field'
import { DateRangeFieldPreview } from './previews/date-range-field'
import { DateTimeFieldPreview } from './previews/date-time-field'
import { NumberFieldPreview } from './previews/number-field'
import { PasswordFieldPreview } from './previews/password-field'
import { RadioFieldPreview } from './previews/radio-field'
import { RowPreview } from './previews/row'
import { SectionPreview } from './previews/section'
import { SelectFieldPreview } from './previews/select-field'
import { SubmitButtonPreview } from './previews/submit-button'
import { SwitchFieldPreview } from './previews/switch-field'
import { TagsFieldPreview } from './previews/tags-field'
import { TextFieldPreview } from './previews/text-field'
import { TextareaFieldPreview } from './previews/textarea-field'

const PREVIEWS = {
  'array-frame': ArrayFramePreview,
  'checkbox-field': CheckboxFieldPreview,
  'checkbox-group-field': CheckboxGroupFieldPreview,
  'combobox-field': ComboboxFieldPreview,
  'date-field': DateFieldPreview,
  'date-range-field': DateRangeFieldPreview,
  'date-time-field': DateTimeFieldPreview,
  'number-field': NumberFieldPreview,
  'password-field': PasswordFieldPreview,
  'radio-field': RadioFieldPreview,
  row: RowPreview,
  section: SectionPreview,
  'select-field': SelectFieldPreview,
  'submit-button': SubmitButtonPreview,
  'switch-field': SwitchFieldPreview,
  'tags-field': TagsFieldPreview,
  'text-field': TextFieldPreview,
  'textarea-field': TextareaFieldPreview,
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
