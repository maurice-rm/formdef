import type { FieldItem, JsonValue, Varying } from '../form-document'
import { isVarying } from '../is-varying'
import type { Answers } from './answers'
import { holds } from './holds'

const valueFor = (varying: Varying, answers: Answers): JsonValue => {
  const applying = varying.cases.find((entry) => holds(entry.when, answers))
  return applying === undefined ? varying.otherwise : applying.value
}

/** A field's settings for these answers: a setting that follows an answer takes its case's value. */
export const resolveSettings = (
  field: FieldItem,
  answers: Answers,
): Readonly<Record<string, JsonValue>> =>
  Object.fromEntries(
    Object.entries(field.settings ?? {}).map(([name, value]) => [
      name,
      isVarying(value) ? valueFor(value, answers) : value,
    ]),
  )
