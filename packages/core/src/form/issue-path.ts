import type { StandardSchemaV1 } from '@tanstack/react-form'

import { childPath } from '../render/child-path'

/** What a Standard Schema's `validate` returns, settled or not. */
export type SchemaResult = ReturnType<StandardSchemaV1['~standard']['validate']>

/** An issue a Standard Schema reports. */
export type SchemaIssue = NonNullable<Exclude<SchemaResult, Promise<unknown>>['issues']>[number]

/** The TanStack field path an issue points at, such as `items[0].name`; `''` for the root. */
export function issuePathOf(issue: SchemaIssue): string {
  return (
    (issue.path ?? []).reduce<string | undefined>((parent, segment) => {
      const key = typeof segment === 'object' ? segment.key : segment

      return childPath(parent, typeof key === 'number' ? key : String(key))
    }, undefined) ?? ''
  )
}
