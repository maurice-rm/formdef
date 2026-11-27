import type { AnyFormApi, StandardSchemaV1 } from '@tanstack/react-form'

import type { Validation } from '../config/validation'
import { issuePathOf, type SchemaIssue } from './issue-path'
import { schemaTimingOf } from './schema-timing'

type StepValidatorInput = {
  /** The schema of the form. */
  schema: StandardSchemaV1
  /** When the schema runs, from the config. */
  validation: Validation | undefined
  /** The root key of the step. */
  key: string
}

/** The errors of a step, as a TanStack group validator reports them: its own, and its fields'. */
type StepErrors = { form?: string[]; fields: Record<string, string[]> }

type StepValidator = {
  run: (context: {
    formApi: AnyFormApi
  }) => StepErrors | undefined | Promise<StepErrors | undefined>
  triggers: readonly unknown[]
  triggerDebounceMs?: number
}

const errorsUnder = (
  issues: readonly SchemaIssue[] | undefined,
  key: string,
): StepErrors | undefined => {
  const prefix = `${key}.`
  const own: string[] = []
  const fields: Record<string, string[]> = {}
  for (const issue of issues ?? []) {
    const path = issuePathOf(issue)
    if (path === key) {
      own.push(issue.message)
    } else if (path.startsWith(prefix)) {
      const relative = path.slice(prefix.length)
      fields[relative] = [...(fields[relative] ?? []), issue.message]
    }
  }
  if (own.length === 0 && Object.keys(fields).length === 0) {
    return undefined
  }

  return own.length === 0 ? { fields } : { form: own, fields }
}

/**
 * A TanStack group validator for the step at `key`: it runs the form's schema over the form's
 * values and reports the issues under the step's key. TanStack's form group runs the validators of
 * its group and its fields on submit, not the form's, which hold the schema.
 */
export function stepValidatorOf({ schema, validation, key }: StepValidatorInput): StepValidator {
  return {
    run: ({ formApi }) => {
      const result = schema['~standard'].validate(formApi.state.values)

      return result instanceof Promise
        ? result.then(({ issues }) => errorsUnder(issues, key))
        : errorsUnder(result.issues, key)
    },
    ...schemaTimingOf(validation),
  }
}
