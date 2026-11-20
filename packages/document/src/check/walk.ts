import type { FieldItem } from '../form-document'
import type { FieldKind } from '../kinds/field-kind'
import type { Problem, ProblemCode } from './problem'

/** A field already passed in document order, which later conditions may compare. */
export type EarlierField = {
  field: FieldItem
  kind: FieldKind<unknown> | undefined
}

/** What a check of one document carries along while it walks the document in order. */
export type Walk = {
  kindOf: (name: string) => FieldKind<unknown> | undefined
  allFieldKeys: ReadonlySet<string>
  earlier: Map<string, EarlierField>
  problems: Problem[]
}

export const report = (
  walk: Walk,
  problem: { code: ProblemCode; path: string; params?: Problem['params'] },
): void => {
  walk.problems.push({ ...problem, params: problem.params ?? {} })
}
