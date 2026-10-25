import core = require('@formdef/core')

export const summaryLink: string = `#${core.fieldId('signup', 'address.zip')}`

// @ts-expect-error a path is a string
export const wrongPath: string = core.fieldId('signup', 1)
