import { defineConfig, type UserConfig } from 'tsdown'

const config: UserConfig = defineConfig({
  entry: { index: 'src/index.ts', react: 'src/react/index.ts' },
  format: ['esm', 'cjs'],
  platform: 'neutral',
  dts: true,
  sourcemap: true,
  deps: {
    neverBundle: true,
    onlyImport: ['@formdef/core', 'react', 'markdown-to-jsx'],
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
