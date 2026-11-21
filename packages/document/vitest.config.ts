import { defineConfig, type ViteUserConfig } from 'vitest/config'

// The tests read `@formdef/core` from its source, as a build of it may run beside them. Setting
// conditions replaces Vite's defaults, so each list repeats them after the source condition.
const SOURCE = '@formdef/source'

const config: ViteUserConfig = defineConfig({
  resolve: { conditions: [SOURCE, 'module', 'browser', 'development|production'] },
  ssr: { resolve: { conditions: [SOURCE, 'module', 'node', 'development|production'] } },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    typecheck: {
      include: ['src/**/*.test-d.{ts,tsx}'],
    },
  },
})

export default config
