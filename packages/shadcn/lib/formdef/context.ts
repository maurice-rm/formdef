'use client'

import { formOptions, getFormHookHelpers } from '@tanstack/react-form'

// Kept apart from the registry on purpose: a form component you register reads the form through
// `useFormContext()` from this file. Taking it from the registry, which imports that component,
// would make the two files import each other. `formOptions` itself stands for any form; a form
// component that needs the types of one form creates its own context from that form's options.
export const { useFormContext } = getFormHookHelpers().formContext.create(formOptions)
