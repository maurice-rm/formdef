import type { StandardSchemaV1 } from '@tanstack/react-form'

import type { ConfigParts } from './config-parts'
import type { FormHandle } from './form-handle'
import type { FormOptionsOf } from './form-options'
import type { InferData } from './infer-data'
import type { LevelConfig } from './level-config'
import type { Validation } from './validation'

/** The parts of a registry a form config reads, without the handle, which the form decides. */
type FormParts = Omit<ConfigParts, 'handle'>

type PartsWithHandle<TParts extends FormParts, TData, TSubmitMeta> = TParts & {
  handle: FormHandle<TData, TSubmitMeta>
}

/**
 * The config of a form with the parts `TParts`: the schema, the default values, the `fields` and
 * `layout` of the root level, when the schema runs, and TanStack's form options, all typed by the
 * schema's data type.
 */
export type FormConfigOf<
  TParts extends FormParts,
  TSchema extends StandardSchemaV1,
  TSubmitMeta,
> = FormOptionsOf<InferData<TSchema>, TSubmitMeta> &
  LevelConfig<PartsWithHandle<TParts, InferData<TSchema>, TSubmitMeta>, InferData<TSchema>> & {
    /** The schema that validates the form; its input type is the form's data type. */
    schema: TSchema
    /**
     * The values the form starts with.
     *
     * @defaultValue none; the form's `options.defaultValues` supply them
     */
    defaultValues?: InferData<TSchema>
    /**
     * When the schema runs.
     *
     * @defaultValue `{ mode: 'revalidate' }`
     */
    validation?: Validation
  }
