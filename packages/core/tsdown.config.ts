import { defineConfig, type UserConfig } from 'tsdown'

const config: UserConfig = defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  platform: 'neutral',
  dts: true,
  sourcemap: true,
  deps: {
    neverBundle: true,
    onlyImport: ['@tanstack/react-form', 'react'],
  },
  exports: {
    devExports: '@formdef/source',
  },
  publint: {
    level: 'error',
  },
  attw: {
    profile: 'node16',
    level: 'error',
  },
})

export default config
