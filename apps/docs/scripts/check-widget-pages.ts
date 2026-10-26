import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const REGISTRY = join(import.meta.dirname, '../../../packages/shadcn/registry.json')
const WIDGET_PAGES = join(import.meta.dirname, '../content/docs/widgets')
const COMPONENT_ITEM = 'registry:component'

type RegistryItem = { name: string; type: string }

const { items } = JSON.parse(readFileSync(REGISTRY, 'utf8')) as { items: RegistryItem[] }

const missing = items
  .filter((item) => item.type === COMPONENT_ITEM)
  .map((item) => item.name)
  .filter((name) => !existsSync(join(WIDGET_PAGES, `${name}.mdx`)))

if (missing.length > 0) {
  console.error(
    `A shadcn registry item has no page under content/docs/widgets:\n${missing.join('\n')}`,
  )
  process.exit(1)
}
