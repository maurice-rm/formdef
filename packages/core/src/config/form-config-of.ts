import type { StandardSchemaV1 } from '@tanstack/react-form'

import type { ConfigParts } from './config-parts'
import type { ExtraProps } from './extra-props'
import type { FormHandle } from './form-handle'
import type { FormOptionsOf } from './form-options'
import type { InferData } from './infer-data'
import type { LevelConfig } from './level-config'
import type { StepEntry } from './step-entry'
import type { StepperProps } from './structure'
import type { Validation } from './validation'

/** The parts of a registry a form config reads, without the handle, which the form decides. */
type FormParts = Omit<ConfigParts, 'handle'>

type PartsWithHandle<TParts extends FormParts, TData> = TParts & {
  handle: FormHandle<TData>
}

// A form's root layout arranges its fields as every level does, or holds only steps.
type FormLevel<TParts extends ConfigParts, TData> = Pick<LevelConfig<TParts, TData>, 'fields'> & {
  /**
   * The order and grouping of the root level, or its steps.
   *
   * @defaultValue the fields in the order `fields` declares them
   */
  layout?: NonNullable<LevelConfig<TParts, TData>['layout']> | StepEntry<TParts, TData>[]
}

type StepperOf<TStructure> = 'stepper' extends keyof TStructure
  ? NonNullable<TStructure['stepper' & keyof TStructure]>
  : never

type StepperConfig<TParts extends FormParts> = [StepperOf<TParts['structure']>] extends [never]
  ? {
      /** A registry without a stepper takes no stepper props. */
      stepper?: never
    }
  : {
      /**
       * What the registered stepper takes besides what the form gives it, such as its variant,
       * for a form of steps.
       *
       * @defaultValue none; the stepper renders with its own defaults
       */
      stepper?: {
        /**
         * The stepper's own props, checked against the registered stepper. A form without steps
         * renders no stepper, so none of them is required here; a stepper's own props are optional.
         */
        props?: ExtraProps<StepperOf<TParts['structure']>, keyof StepperProps>
      }
    }

/**
 * The config of a form with the parts `TParts`: the schema, the default values, the `fields` and
 * `layout` of the root level, the stepper's own props, when the schema runs, and TanStack's form
 * options, all typed by the schema's data type.
 */
export type FormConfigOf<
  TParts extends FormParts,
  TSchema extends StandardSchemaV1,
> = FormOptionsOf<InferData<TSchema>> &
  FormLevel<PartsWithHandle<TParts, InferData<TSchema>>, InferData<TSchema>> &
  StepperConfig<TParts> & {
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
