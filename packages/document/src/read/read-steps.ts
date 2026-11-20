import { failAt } from '../fail-at'
import type { DocumentStep, Jump } from '../form-document'
import { hasKey } from './has-key'
import { readCondition } from './read-condition'
import { readDisplay } from './read-display'
import { readItems } from './read-items'
import { readList } from './read-list'
import { readOnlyKeys } from './read-only-keys'
import { readOptionalText } from './read-optional-text'
import { readShape } from './read-shape'
import { readText } from './read-text'
import { readTranslatableText } from './read-translatable-text'
import { readVisibleWhen } from './read-visible-when'
import { withOptional } from './with-optional'

const STEP_KEYS = ['key', 'label', 'description', 'visibleWhen', 'display', 'next', 'items']
const JUMP_KEYS = ['when', 'step', 'end']

const readJump = (value: unknown, path: string): Jump => {
  const shape = readShape(value, path)
  readOnlyKeys(shape, JUMP_KEYS, path)
  if (hasKey(shape, 'step') && hasKey(shape, 'end')) {
    failAt(path, 'expected either step or end, not both.')
  }
  const when = readCondition(shape.when, `${path}.when`)
  return hasKey(shape, 'end')
    ? { when, end: readText(shape.end, `${path}.end`) }
    : { when, step: readText(shape.step, `${path}.step`) }
}

const readJumps = (value: unknown, path: string): Jump[] =>
  readList(value, path).map((entry, index) => readJump(entry, `${path}[${index}]`))

const readStep = (value: unknown, path: string): DocumentStep => {
  const shape = readShape(value, path)
  readOnlyKeys(shape, STEP_KEYS, path)

  return {
    key: readText(shape.key, `${path}.key`),
    label: readTranslatableText(shape.label, `${path}.label`),
    ...withOptional('description', readOptionalText(shape.description, `${path}.description`)),
    ...readVisibleWhen(shape, path),
    ...readDisplay(shape, path),
    ...withOptional(
      'next',
      shape.next === undefined ? undefined : readJumps(shape.next, `${path}.next`),
    ),
    items: readItems(shape.items, `${path}.items`),
  }
}

export function readSteps(value: unknown, path: string): DocumentStep[] {
  return readList(value, path).map((entry, index) => readStep(entry, `${path}[${index}]`))
}
