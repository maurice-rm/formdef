import { fieldId } from '@formdef/core'

export const summaryLink: string = `#${fieldId('signup', 'address.zip')}`

// @ts-expect-error a path is a string
export const wrongPath: string = fieldId('signup', 1)
