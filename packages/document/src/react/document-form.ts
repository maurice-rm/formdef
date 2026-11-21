import type { FormProps } from '@formdef/core'
import type { ReactNode } from 'react'

import type { DocumentValidator } from '../validate/create-validator'

/**
 * A form component rendered from a form document. It takes the props of every formdef form
 * component, such as `options.onSubmit`; its values are the document's answers.
 */
export type DocumentForm = (props: FormProps<DocumentValidator>) => ReactNode
