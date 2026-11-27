/**
 * When the schema of a form runs, as the `validation` option of a form config.
 *
 * | `mode` | Runs the schema |
 * | --- | --- |
 * | `revalidate` (default) | on submit, then on every change |
 * | `blurThenChange` | when a field is left, then on every change while the form is invalid |
 * | `onChange`, `onBlur`, `onSubmit` | at that moment |
 *
 * An asynchronous schema needs `async: true`, which also allows a debounce. The schema runs after
 * the validators of the config and of the form's `options`, and on every submit.
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
       * never waits.
       *
       * @defaultValue none; the schema runs at once
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
