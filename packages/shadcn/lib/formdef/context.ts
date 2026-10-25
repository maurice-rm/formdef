'use client'

import { createFormHookContexts } from '@tanstack/react-form'

// Kept apart from the registry on purpose: a form component you register reads the form through
// `useFormContext()` from this file. Taking it from the registry, which imports that component,
// would make the two files import each other.
export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()
