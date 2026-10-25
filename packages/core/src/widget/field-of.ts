import type { FieldApi } from '@tanstack/react-form'
import type { ComponentType } from 'react'

// TanStack declares every parameter of `FieldApi` as invariant (`in out`). Only `any` lets a field
// of any form, at any path and with any validators fit a widget that fixes the value type alone.
// biome-ignore lint/suspicious/noExplicitAny: the open axes of TanStack's invariant FieldApi.
type OpenAxis = any

/**
 * TanStack Form's `FieldApi` with the value type fixed and every other type parameter open.
 *
 * This is the type of the `field` a widget receives: the real field of a form, with its
 * `state`, `handleChange`, `handleBlur` and the rest of TanStack's API.
 *
 * @typeParam TValue - The type of the value the field holds.
 *
 * @example
 * ```ts
 * const isEmpty = (field: FieldApiOf<string>): boolean => field.state.value === ''
 * ```
 */
export type FieldApiOf<TValue> = FieldApi<
  OpenAxis,
  OpenAxis,
  TValue,
  OpenAxis,
  OpenAxis,
  OpenAxis,
  OpenAxis,
  OpenAxis,
  OpenAxis,
  OpenAxis,
  OpenAxis,
  OpenAxis,
  OpenAxis,
  OpenAxis,
  OpenAxis,
  OpenAxis,
  OpenAxis,
  OpenAxis,
  OpenAxis,
  OpenAxis,
  OpenAxis,
  OpenAxis,
  OpenAxis
>

/**
 * The props every widget takes: the field it renders, as a prop.
 *
 * A widget states the value type it serves through `FieldOf`, and formdef reads it back to check
 * that a field entry only names widgets that fit the field's value. Every other prop of the widget
 * is its own and is passed through the entry's `props`.
 *
 * @typeParam TValue - The type of the value the widget renders and edits.
 *
 * @example
 * ```tsx
 * const TextField = ({ field, label }: FieldOf<string> & { label?: string }) => (
 *   <label>
 *     {label}
 *     <input
 *       value={field.state.value}
 *       onChange={(event) => field.handleChange(event.target.value)}
 *       onBlur={field.handleBlur}
 *     />
 *   </label>
 * )
 * ```
 */
export interface FieldOf<TValue> {
  /** The field this widget renders. */
  field: FieldApiOf<TValue>
}

/**
 * The value type a widget declares through `FieldOf`; `unknown` for a widget that takes its
 * field from context instead.
 */
export type ValueOf<TWidget> =
  TWidget extends ComponentType<infer Props>
    ? Props extends FieldOf<infer TValue>
      ? TValue
      : unknown
    : unknown

/**
 * The names of the widgets that can render a value of type `TValue`. An optional or nullable
 * value is matched by its base type; the widget handles the missing value.
 */
export type Compatible<TWidgets, TValue> = {
  [Name in keyof TWidgets]: NonNullable<TValue> extends ValueOf<TWidgets[Name]> ? Name : never
}[keyof TWidgets] &
  string
