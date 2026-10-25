import type { ReactNode } from 'react'

import type { FieldApiOf } from '../widget/field-of'
import type { FieldEntryOptions } from './field-entry-options'
import type { LeafEntry } from './leaf-entry'

type OneShape = 'formdef: an entry has one shape: widget, fields, item or render'
type NotALevel = 'formdef: fields describes an object, and this value is not one'

// `widget` is blocked with `undefined` rather than the message: on a leaf the message would join
// the union of widget names and spoil the spelling suggestion TypeScript offers there.
type ShapeMarkers<TValue> = {
  widget?: undefined
  fields?: IsLevel<TValue> extends true ? OneShape : NotALevel
  item?: OneShape
  render?: OneShape
}

type Owns<TMarker extends keyof ShapeMarkers<unknown>, TValue> = Omit<ShapeMarkers<TValue>, TMarker>

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

// `unknown` is checked first: its non-nullable part is `{}`, which passes for an object.
type IsLevel<TValue> = unknown extends TValue
  ? false
  : [Extract<NonNullable<TValue>, SingleValue>] extends [never]
    ? NonNullable<TValue> extends object
      ? true
      : false
    : false

// A part of an optional or nullable object may be missing at runtime, whatever its own level
// declares.
type PartOf<TValue, TKey extends keyof NonNullable<TValue>> = undefined extends TValue
  ? NonNullable<TValue>[TKey] | undefined
  : null extends TValue
    ? NonNullable<TValue>[TKey] | undefined
    : NonNullable<TValue>[TKey]

type Level<TWidgets, TValue, TValues> = {
  [Key in keyof NonNullable<TValue>]?: FieldEntry<
    TWidgets,
    PartOf<TValue, Key>,
    TValues,
    NonNullable<TValue>[Key]
  >
}

type LeafShape<TWidgets, TValue, TValues, TDeclared> = LeafEntry<
  TWidgets,
  TValue,
  TValues,
  TDeclared
> &
  Owns<'widget', TValue>

type ObjectShape<TWidgets, TValue, TValues> = {
  fields: Level<TWidgets, TValue, TValues>
} & Owns<'fields', TValue>

type CustomShape<TValue> = {
  render: (field: FieldApiOf<TValue>) => ReactNode
} & Owns<'render', TValue>

/**
 * One entry under `fields`, for a value of type `TValue` in a form whose values are `TValues`: a
 * leaf (`widget`), an object (`fields`) or a custom entry (`render`), each with the options every
 * entry shares. An entry has exactly one of these shapes. `TDeclared` is the value type its own
 * level declares; it differs from `TValue` only below an optional or nullable object.
 */
export type FieldEntry<TWidgets, TValue, TValues, TDeclared = TValue> = FieldEntryOptions<
  TValue,
  TValues
> &
  (
    | LeafShape<TWidgets, TValue, TValues, TDeclared>
    | (IsLevel<TValue> extends true ? ObjectShape<TWidgets, TValue, TValues> : never)
    | CustomShape<TValue>
  )
