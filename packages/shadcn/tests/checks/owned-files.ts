/** The files of the setup item, which every project fetches first, so other items import them. */
export const SETUP_FILES: ReadonlySet<string> = new Set([
  'lib/formdef/context.ts',
  'lib/formdef/index.tsx',
])

/** The files a project owns and edits; their comments say what to do in them. */
export const OWNED_FILES: ReadonlySet<string> = new Set([...SETUP_FILES, 'lib/formdef/catalog.ts'])
