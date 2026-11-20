import type { FieldItem } from '../form-document'
import type { Answers } from './answers'
import { holds } from './holds'

/** Whether a field must be filled in for these answers, by `required` or its condition. */
export const isRequired = (field: FieldItem, answers: Answers): boolean =>
  typeof field.required === 'object' ? holds(field.required, answers) : field.required === true
