import type { FieldItem } from '../form-document'
import type { Answers } from './answers'
import { holds } from './holds'

/** Whether a field must be filled in for these answers, by `required` or its condition. */
export function isRequired(field: FieldItem, answers: Answers): boolean {
  return typeof field.required === 'object'
    ? holds(field.required, answers)
    : field.required === true
}
