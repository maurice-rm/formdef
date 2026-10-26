import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const REGISTRY = join(import.meta.dirname, '../../../packages/shadcn/registry.json')
const WIDGET_PAGES = join(import.meta.dirname, '../content/docs/widgets')
const COMPONENT_ITEM = 'registry:component'

// Items whose page has not been written yet; the list empties as the pages land.
const PAGES_PENDING = new Set([
  'textarea-field',
  'password-field',
  'number-field',
  'checkbox-field',
  'switch-field',
  'radio-field',
  'select-field',
  'checkbox-group-field',
  'combobox-field',
  'date-range-field',
  'date-time-field',
  'tags-field',
  'section',
  'row',
  'array-frame',
  'submit-button',
])

type RegistryItem = { name: string; type: string }

const { items } = JSON.parse(readFileSync(REGISTRY, 'utf8')) as { items: RegistryItem[] }

const missing = items
  .filter((item) => item.type === COMPONENT_ITEM && !PAGES_PENDING.has(item.name))
  .map((item) => item.name)
  .filter((name) => !existsSync(join(WIDGET_PAGES, `${name}.mdx`)))

if (missing.length > 0) {
  console.error(
    `A shadcn registry item has no page under content/docs/widgets:\n${missing.join('\n')}`,
  )
  process.exit(1)
}
