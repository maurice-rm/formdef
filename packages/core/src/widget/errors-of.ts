import type { FieldApiOf } from './field-of'

function textOf(error: unknown): string | undefined {
  if (typeof error === 'string') {
    return error
  }
  if (typeof error !== 'object' || error === null || !('message' in error)) {
    return undefined
  }

  return typeof error.message === 'string' ? error.message : undefined
}

function hasText(text: string | undefined): text is string {
  return text !== undefined && text !== ''
}

/**
 * Turns the errors of a field into the texts a widget renders.
 *
 * An error is either a string or an object with a `message`, such as an issue of a Standard
 * Schema. Errors without text are left out, and a text that several validators report appears
 * once, where it first occurs. A field's errors stay readable with TanStack's `disableErrorFlat`
 * option.
 *
 * @typeParam TValue - The value type of the field.
 * @param field - The field the widget renders.
 * @returns The distinct texts of the field's current errors, in order; empty when there are none.
 *
 * @example
 * ```tsx
 * const TextField = ({ field }: FieldOf<string>) => (
 *   <>
 *     <input value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} />
 *     <p>{errorsOf(field).join(' ')}</p>
 *   </>
 * )
 * ```
 */
export function errorsOf<TValue>(field: FieldApiOf<TValue>): string[] {
  const texts = field.state.meta.errors.flat().map(textOf).filter(hasText)

  return [...new Set(texts)]
}
