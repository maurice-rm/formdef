import { ServerCodeBlock } from 'fumadocs-ui/components/codeblock.rsc'
import type { ReactNode } from 'react'

import { siteUrl } from '@/lib/site-url'

const REGISTRY_PATH = '/r/{style}/{name}.json'

const CODE_THEMES = { light: 'github-light', dark: 'github-dark' }

const componentsJson = JSON.stringify(
  { registries: { '@formdef': `${siteUrl.origin}${REGISTRY_PATH}` } },
  null,
  2,
)

/** The `registries` entry of a project's `components.json`, pointing at this site's registry. */
export const RegistryConfig = (): ReactNode => (
  <ServerCodeBlock
    code={componentsJson}
    lang="json"
    themes={CODE_THEMES}
    codeblock={{ title: 'components.json' }}
  />
)
