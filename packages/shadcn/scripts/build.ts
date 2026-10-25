import { cpSync, rmSync } from 'node:fs'
import { join } from 'node:path'

// The shipped files are written for Base UI. A project on a Radix or React Aria style resolves
// `{style}` to a folder that does not exist and fails, rather than receiving the wrong files.
const BASE_STYLES = ['vega', 'nova', 'maia', 'lyra', 'mira', 'luma', 'sera', 'rhea'].map(
  (theme) => `base-${theme}`,
)

const ROOT = join(import.meta.dirname, '..')
const BUILT = join(ROOT, '.registry')
const OUTPUT = join(ROOT, '../../apps/docs/public/r')

rmSync(OUTPUT, { recursive: true, force: true })
for (const style of BASE_STYLES) {
  cpSync(BUILT, join(OUTPUT, style), { recursive: true })
}
