import { errorsOf, type FieldOf, fieldId } from '@formdef/core'

export const summaryLink: string = `#${fieldId('signup', 'address.zip')}`

// @ts-expect-error a path is a string
export const wrongPath: string = fieldId('signup', 1)

export const readValue = ({ field }: FieldOf<string>): string => field.state.value

// @ts-expect-error a string field holds no number
export const readNumber = ({ field }: FieldOf<string>): number => field.state.value

export const readErrors = ({ field }: FieldOf<string>): string[] => errorsOf(field)
