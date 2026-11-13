import { useSelector } from '@tanstack/react-form'

import type { FieldApiOf } from './field-of'
import { type FieldParts, fieldPartsFor } from './field-parts'

/**
 * Wires a widget's control to its field: its id and name, the blur report, and the aria
 * attributes that tie it to its description and its errors.
 *
 * An error is due once the field is invalid and was edited and left, or once the form was
 * submitted. While one is due, `aria-invalid` is `true`; while one with text is due, the control
 * points at the error element through `aria-describedby` and `aria-errormessage`. An id appears in
 * them only when its element is rendered.
 *
 * The hook subscribes to whether the form was submitted, so a submit renders the widget again even
 * when its field state does not change, as for a field that was left before without an edit.
 *
 * @typeParam TValue - The value type of the field.
 * @param field - The field the widget renders.
 * @param options - What the widget renders besides the control.
 * @param options.description - The description the widget renders below its label, if any. Only
 *   whether it is a non-empty string is read.
 * @defaultValue `options.description`: `undefined`, no description is rendered.
 * @returns The props for the control, the ids for the description and error elements, whether an
 *   error is due, and the error texts.
 *
 * @example
 * ```tsx
 * const TextField = ({ field, label, description }: FieldOf<string> & { label: string; description?: string }) => {
 *   const { control, descriptionId, errorId, isErrorDue, errors } = useFieldParts(field, { description })
 *
 *   return (
 *     <div>
 *       <label htmlFor={control.id}>{label}</label>
 *       {description && <p id={descriptionId}>{description}</p>}
 *       <input {...control} value={field.state.value} onChange={(event) => field.handleChange(event.target.value)} />
 *       {isErrorDue && errors.length > 0 && <p id={errorId}>{errors.join(' ')}</p>}
 *     </div>
 *   )
 * }
 * ```
 */
export function useFieldParts<TValue>(
  field: FieldApiOf<TValue>,
  options: { description?: string | undefined } = {},
): FieldParts {
  const wasSubmitted = useSelector(field.form.store, (state) => state.submissionAttempts > 0)

  return fieldPartsFor(field, { ...options, wasSubmitted })
}
