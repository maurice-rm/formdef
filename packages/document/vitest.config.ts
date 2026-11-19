import { defineConfig, type ViteUserConfig } from 'vitest/config'

const config: ViteUserConfig = defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
    typecheck: {
      include: ['src/**/*.test-d.ts'],
    },
  },
})

export default config
