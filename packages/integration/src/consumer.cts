import core = require('@formdef/core')

export const summaryLink: string = `#${core.fieldId('signup', 'address.zip')}`

// @ts-expect-error a path is a string
export const wrongPath: string = core.fieldId('signup', 1)

export const readValue = ({ field }: core.FieldOf<string>): string => field.state.value

// @ts-expect-error a string field holds no number
export const readNumber = ({ field }: core.FieldOf<string>): number => field.state.value

export const readErrors = ({ field }: core.FieldOf<string>): string[] => core.errorsOf(field)

export const rowChildren = ({ children }: core.RowProps): unknown => children

export const bodyChildren = ({ children }: core.BodyProps): unknown => children
