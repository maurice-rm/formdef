import type { JsonValue } from '../json-value'
import type { SettingType } from './setting'

/**
 * How an answer of a value type is compared with, when a condition compares another field with it
 * through `valueFrom`: as a value of a setting type, such as a decimal as a `number`.
 *
 * @typeParam TValue - The value of an answer of the value type.
 */
export type ComparesAs<TValue = unknown> = {
  /** The setting type the answer compares as; an operator that compares with it accepts it. */
  readonly type: SettingType
  /** The answer as a value of that setting type. */
  of(value: TValue): JsonValue
}
