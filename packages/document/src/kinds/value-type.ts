/**
 * What kind of answer a field kind gives, which decides the operators a condition may compare it
 * with and how an answer is described: text, one choice of its options, several choices, a
 * boolean, a number, a decimal written as text, or a date as an ISO string.
 */
export type ValueType = (typeof VALUE_TYPES)[number]

export const VALUE_TYPES: readonly [
  'text',
  'choice',
  'choices',
  'boolean',
  'number',
  'decimal',
  'date',
] = ['text', 'choice', 'choices', 'boolean', 'number', 'decimal', 'date']
