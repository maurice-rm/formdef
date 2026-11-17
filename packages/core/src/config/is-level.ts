type PlatformValue =
  | Date
  | File
  | Blob
  | RegExp
  | ReadonlyMap<unknown, unknown>
  | ReadonlySet<unknown>

type SingleValue =
  | PlatformValue
  | string
  | number
  | bigint
  | boolean
  | symbol
  | readonly unknown[]
  | ((...args: never[]) => unknown)

/**
 * Whether a value of type `TValue` is an object level: an object with parts of its own, not a
 * platform value, an array or a function. `unknown` is checked first: its non-nullable part is
 * `{}`, which passes for an object.
 */
export type IsLevel<TValue> = unknown extends TValue
  ? false
  : [Extract<NonNullable<TValue>, SingleValue>] extends [never]
    ? NonNullable<TValue> extends object
      ? true
      : false
    : false
