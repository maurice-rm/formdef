import { errorsOf, type FieldOf, fieldId, type Validation } from '@formdef/core'

export const summaryLink: string = `#${fieldId('signup', 'address.zip')}`

// @ts-expect-error a path is a string
export const wrongPath: string = fieldId('signup', 1)

export const readValue = ({ field }: FieldOf<string>): string => field.state.value

// @ts-expect-error a string field holds no number
export const readNumber = ({ field }: FieldOf<string>): number => field.state.value

export const readErrors = ({ field }: FieldOf<string>): string[] => errorsOf(field)

export const validation: Validation = { mode: 'onChange', async: true, asyncDebounceMs: 300 }

// @ts-expect-error a debounce applies to an asynchronous schema only
export const debounceWithoutAsync: Validation = { asyncDebounceMs: 300 }
