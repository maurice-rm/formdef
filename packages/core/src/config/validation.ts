/**
 * When the schema of a form runs, as the `validation` option of a form config.
 *
 * | `mode` | Runs the schema |
 * | --- | --- |
 * | `revalidate` (default) | on submit, then on every change |
 * | `blurThenChange` | when a field is left, then on every change while the form is invalid |
 * | `onChange`, `onBlur`, `onSubmit` | at that moment |
 *
 * An asynchronous schema needs `async: true`, which also allows a debounce. A validator the config
 * places itself in the slot a mode picks takes precedence, and the schema is not placed there.
 *
 * @example
 * ```ts
 * const validation: Validation = { mode: 'blurThenChange' }
 * const remote: Validation = { mode: 'onChange', async: true, asyncDebounceMs: 300 }
 * ```
 */
export type Validation = {
  /**
   * When the schema runs.
   *
   * @defaultValue `'revalidate'`
   */
  mode?: 'revalidate' | 'blurThenChange' | 'onChange' | 'onBlur' | 'onSubmit'
} & (
  | {
      /** The schema validates asynchronously. */
      async: true
      /**
       * How long the schema waits after the event that triggers it, in milliseconds; on submit it
       * never waits. An `asyncDebounceMs` of the form config takes precedence.
       *
       * @defaultValue the form config's `asyncDebounceMs`, or `0`
       */
      asyncDebounceMs?: number
    }
  | {
      /**
       * The schema validates synchronously.
       *
       * @defaultValue `false`
       */
      async?: false
    }
)
