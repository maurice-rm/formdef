import { defineConfig, type ViteUserConfig } from 'vitest/config'

const config: ViteUserConfig = defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
    typecheck: {
      include: ['src/**/*.test-d.{ts,tsx}'],
    },
  },
})

export default config
