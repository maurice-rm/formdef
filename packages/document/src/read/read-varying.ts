import type { Condition } from '../condition'
import { failAt } from '../fail-at'
import { pathTo } from '../path-to'
import { hasKey } from './has-key'
import { readCondition } from './read-condition'
import { readList } from './read-list'
import { readOnlyKeys } from './read-only-keys'
import { readShape, type Shape } from './read-shape'

type ReadValue<TValue> = (value: unknown, path: string) => TValue

const VARYING_KEYS = ['cases', 'otherwise']
const CASE_KEYS = ['when', 'value']

const readCase = <TValue>(
  value: unknown,
  { path, readValue }: { path: string; readValue: ReadValue<TValue> },
): { when: Condition; value: TValue } => {
  const shape = readShape(value, path)
  readOnlyKeys(shape, CASE_KEYS, path)

  return {
    when: readCondition(shape.when, `${path}.when`),
    value: readValue(shape.value, `${path}.value`),
  }
}

/** Reads a value that follows an answer, `{ cases, otherwise }`, each value read as given. */
export function readVarying<TValue>(
  shape: Shape,
  path: string,
  readValue: ReadValue<TValue>,
): { cases: { when: Condition; value: TValue }[]; otherwise: TValue } {
  readOnlyKeys(shape, VARYING_KEYS, path)
  const cases = readList(shape.cases, `${path}.cases`).map((entry, index) =>
    readCase(entry, { path: pathTo.case(path, index), readValue }),
  )
  if (!hasKey(shape, 'otherwise')) {
    failAt(pathTo.otherwise(path), 'expected a value.')
  }

  return { cases, otherwise: readValue(shape.otherwise, pathTo.otherwise(path)) }
}
