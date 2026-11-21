import { failAt } from '../fail-at'
import type { DocumentStep, Jump } from '../form-document'
import { hasKey } from './has-key'
import { readCondition } from './read-condition'
import { readDisplay } from './read-display'
import { readEach } from './read-each'
import { readItems } from './read-items'
import { readOnlyKeys } from './read-only-keys'
import { readOptional } from './read-optional'
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

const readJumps = (value: unknown, path: string): Jump[] => readEach(value, path, readJump)

const readStep = (value: unknown, path: string): DocumentStep => {
  const shape = readShape(value, path)
  readOnlyKeys(shape, STEP_KEYS, path)

  return {
    key: readText(shape.key, `${path}.key`),
    label: readTranslatableText(shape.label, `${path}.label`),
    ...withOptional('description', readOptionalText(shape.description, `${path}.description`)),
    ...readVisibleWhen(shape, path),
    ...readDisplay(shape, path),
    ...readOptional(shape, 'next', { path, read: readJumps }),
    items: readItems(shape.items, `${path}.items`),
  }
}

export function readSteps(value: unknown, path: string): DocumentStep[] {
  return readEach(value, path, readStep)
}
