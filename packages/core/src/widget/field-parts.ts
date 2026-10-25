import { errorsOf } from './errors-of'
import { fieldId } from './field-id'
import type { FieldApiOf } from './field-of'

const DESCRIPTION_SUFFIX = '-description'
const ERROR_SUFFIX = '-error'
const IDREF_SEPARATOR = ' '

/**
 * What {@link fieldParts} returns: the wiring of a widget's control and what it needs to render
 * its description and its errors.
 */
export interface FieldParts {
  /** Props to spread onto the control; its value and change handler stay with the widget. */
  control: {
    /** The control's id, as {@link fieldId} builds it. */
    id: string
    /** The field's path, so the browser can autofill the control. */
    name: string
    /** Reports to the field that the control was left. */
    onBlur: () => void
    /** `true` while an error is due; absent otherwise, never `false`. */
    'aria-invalid': true | undefined
    /** The ids of the description and of a due error with text, when there are any. */
    'aria-describedby': string | undefined
    /** The id of the error element, while an error with text is due. */
    'aria-errormessage': string | undefined
  }
  /** The id to give the element that renders the description. */
  descriptionId: string
  /** The id to give the element that renders the error texts. */
  errorId: string
  /**
   * Whether the widget shows the field's errors now: the field is invalid and was edited and
   * left, or the form was submitted.
   */
  isErrorDue: boolean
  /** The texts of the field's errors, as {@link errorsOf} returns them. */
  errors: string[]
}

function isErrorDueFor<TValue>(field: FieldApiOf<TValue>): boolean {
  const { isBlurred, isDirty, isValid } = field.state.meta
  const wasEditedAndLeft = isBlurred && isDirty
  const wasSubmitted = field.form.state.submissionAttempts > 0

  return !isValid && (wasEditedAndLeft || wasSubmitted)
}

function idrefsOf(ids: (string | undefined)[]): string | undefined {
  const present = ids.filter((id) => id !== undefined)

  return present.length > 0 ? present.join(IDREF_SEPARATOR) : undefined
}

/**
 * Wires a widget's control to its field: its id and name, the blur report, and the aria
 * attributes that tie it to its description and its errors.
 *
 * An error is due once the field is invalid and was edited and left, or once the form was
 * submitted. While one is due, `aria-invalid` is `true`; while one with text is due, the control
 * points at the error element through `aria-describedby` and `aria-errormessage`. An id appears in
 * them only when its element is rendered.
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
 *   const { control, descriptionId, errorId, isErrorDue, errors } = fieldParts(field, { description })
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
export function fieldParts<TValue>(
  field: FieldApiOf<TValue>,
  options: { description?: string | undefined } = {},
): FieldParts {
  const id = fieldId(field.form.formId, field.name)
  const descriptionId = `${id}${DESCRIPTION_SUFFIX}`
  const errorId = `${id}${ERROR_SUFFIX}`
  const isErrorDue = isErrorDueFor(field)
  const errors = errorsOf(field)
  const isErrorNamed = isErrorDue && errors.length > 0
  const hasDescription = options.description !== undefined && options.description !== ''

  return {
    control: {
      id,
      name: field.name,
      onBlur: field.handleBlur,
      'aria-invalid': isErrorDue || undefined,
      'aria-describedby': idrefsOf([
        hasDescription ? descriptionId : undefined,
        isErrorNamed ? errorId : undefined,
      ]),
      'aria-errormessage': isErrorNamed ? errorId : undefined,
    },
    descriptionId,
    errorId,
    isErrorDue,
    errors,
  }
}
