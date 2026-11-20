import type { DocumentStep } from '../form-document'
import { readItems } from './read-items'
import { readList } from './read-list'
import { readOnlyKeys } from './read-only-keys'
import { readOptionalText } from './read-optional-text'
import { readShape } from './read-shape'
import { readText } from './read-text'
import { readVisibleWhen } from './read-visible-when'
import { withOptional } from './with-optional'

const STEP_KEYS = ['key', 'label', 'description', 'visibleWhen', 'items']

const readStep = (value: unknown, path: string): DocumentStep => {
  const shape = readShape(value, path)
  readOnlyKeys(shape, STEP_KEYS, path)

  return {
    key: readText(shape.key, `${path}.key`),
    label: readText(shape.label, `${path}.label`),
    ...withOptional('description', readOptionalText(shape.description, `${path}.description`)),
    ...readVisibleWhen(shape, path),
    items: readItems(shape.items, `${path}.items`),
  }
}

export function readSteps(value: unknown, path: string): DocumentStep[] {
  return readList(value, path).map((entry, index) => readStep(entry, `${path}[${index}]`))
}
