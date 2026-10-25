import type { StandardSchemaV1 } from '@tanstack/react-form'

/**
 * The data type of a form whose schema is `TSchema`: the type of the values the schema accepts,
 * which is the type of the form's values while the user edits them.
 *
 * It is the schema's input, not its output. A schema that transforms `'42'` into `42` makes the
 * field a string; a key with a default is optional; a schema that coerces its input, such as
 * `z.coerce.number()`, accepts anything and makes the field `unknown`. A schema that does not
 * declare its types, which the standard allows, makes the whole data type `unknown`.
 *
 * @typeParam TSchema - Any Standard Schema: zod, valibot, ArkType and others.
 *
 * @example
 * ```ts
 * const schema = z.object({ email: z.email(), age: z.string().transform(Number) })
 *
 * const defaultValues: InferData<typeof schema> = { email: '', age: '' }
 * ```
 */
export type InferData<TSchema extends StandardSchemaV1> =
  NonNullable<TSchema['~standard']['types']> extends { input: infer TInput } ? TInput : unknown
