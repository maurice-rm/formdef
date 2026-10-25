import { fileURLToPath } from 'node:url'
import { defineConfig, type ViteUserConfig } from 'vitest/config'

const config: ViteUserConfig = defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
    conditions: ['@formdef/source'],
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    typecheck: {
      include: ['tests/**/*.test-d.{ts,tsx}'],
      tsconfig: 'tsconfig.node.json',
    },
  },
})

export default config
