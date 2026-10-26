import { join } from 'node:path'

import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins'
import { defineConfig } from 'fumadocs-mdx/config'
import { transformerTwoslash } from 'fumadocs-twoslash'

const SHADCN_PACKAGE = join(process.cwd(), '../../packages/shadcn')

// Twoslash checks every ts and tsx block with its own compiler, so the library's strictness is
// repeated here; `@formdef/source` resolves the workspace packages to their sources, and `@/`
// resolves to the widgets as `shadcn add` installs them.
const LIBRARY_COMPILER_OPTIONS = {
  target: 'es2022',
  module: 'esnext',
  moduleResolution: 'bundler',
  customConditions: ['@formdef/source'],
  jsx: 'react-jsx',
  strict: true,
  exactOptionalPropertyTypes: true,
  noUncheckedIndexedAccess: true,
  skipLibCheck: true,
  paths: { '@/*': [`${SHADCN_PACKAGE}/*`] },
}

export default defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      transformers: [
        ...(rehypeCodeDefaultOptions.transformers ?? []),
        transformerTwoslash({
          explicitTrigger: false,
          twoslashOptions: { compilerOptions: LIBRARY_COMPILER_OPTIONS },
        }),
      ],
      langs: ['js', 'jsx', 'ts', 'tsx', 'bash', 'json'],
    },
  },
})
