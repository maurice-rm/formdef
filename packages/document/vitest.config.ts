import { defineConfig, type ViteUserConfig } from 'vitest/config'

const config: ViteUserConfig = defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    typecheck: {
      include: ['src/**/*.test-d.{ts,tsx}'],
    },
  },
})

export default config
