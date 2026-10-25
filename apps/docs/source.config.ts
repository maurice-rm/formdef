import { rehypeCodeDefaultOptions } from 'fumadocs-core/mdx-plugins'
import { defineConfig } from 'fumadocs-mdx/config'
import { transformerTwoslash } from 'fumadocs-twoslash'

// Twoslash checks every ts and tsx block with its own compiler, so the library's strictness is
// repeated here; `@formdef/source` resolves the workspace packages to their sources.
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
