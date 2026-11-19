import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// What one form with two fields may cost the compiler on top of a registry with every widget of
// the shadcn registry. A config check that walks every widget's props per field costs millions.
const MAX_FORM_INSTANTIATIONS = 100_000

// What one leaf of a large form may cost: ten steps of ten leaves each, a fifth of them
// conditional. Measured at about 5,600 per leaf; a cost that grows faster than the leaves shows here.
const CHECKLIST_LEAVES = 100
const MAX_CHECKLIST_INSTANTIATIONS_PER_LEAF = 8_000

const INSTANTIATIONS = /^Instantiations:\s+(\d+)$/m

// `typescript` exports no path to its compiler, but its package.json, which sits beside it.
const tsc = fileURLToPath(new URL('bin/tsc', import.meta.resolve('typescript/package.json')))

const instantiationsOf = (project: string): number => {
  const tsconfig = fileURLToPath(new URL(`type-cost/tsconfig.${project}.json`, import.meta.url))
  const output = execFileSync(process.execPath, [tsc, '-p', tsconfig, '--extendedDiagnostics'], {
    encoding: 'utf8',
  })
  const count = INSTANTIATIONS.exec(output)?.[1]
  if (count === undefined) {
    throw new Error(`check-type-cost: tsc reported no instantiation count for ${project}.`)
  }

  return Number(count)
}

const formCost = instantiationsOf('form') - instantiationsOf('no-form')

if (formCost > MAX_FORM_INSTANTIATIONS) {
  throw new Error(
    `check-type-cost: one form costs ${formCost} instantiations on top of its registry, more than ${MAX_FORM_INSTANTIATIONS}.`,
  )
}

const costPerLeaf = Math.round(
  (instantiationsOf('checklist') - instantiationsOf('no-checklist')) / CHECKLIST_LEAVES,
)

if (costPerLeaf > MAX_CHECKLIST_INSTANTIATIONS_PER_LEAF) {
  throw new Error(
    `check-type-cost: a leaf of a large form costs ${costPerLeaf} instantiations, more than ${MAX_CHECKLIST_INSTANTIATIONS_PER_LEAF}.`,
  )
}
