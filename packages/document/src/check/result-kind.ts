/** What an expression comes to: a number, a text, or a date as an ISO string. */
export type ResultKind = 'number' | 'text' | 'date'

const RESULT_KINDS: ReadonlySet<string> = new Set<ResultKind>(['number', 'text', 'date'])

/** Whether a setting type or value type name is one an expression comes to. */
export function isResultKind(name: string | undefined): name is ResultKind {
  return name !== undefined && RESULT_KINDS.has(name)
}
