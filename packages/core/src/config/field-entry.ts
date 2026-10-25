import type { ReactNode } from 'react'

import type { FieldApiOf } from '../widget/field-of'
import type { ConfigParts } from './config-parts'
import type { ExtraProps } from './extra-props'
import type { FieldEntryOptions } from './field-entry-options'
import type { LayoutEntry } from './layout-entry'
import type { LeafEntry } from './leaf-entry'
import type { PropsEntry } from './props-entry'
import type { ArrayFrameProps } from './structure'

type OneShape = 'formdef: an entry has one shape: widget, fields, item or render'
type NotALevel = 'formdef: fields describes an object, and this value is not one'
type NotAnArray = 'formdef: item describes the items of an array, and this value is not one'

// `widget` is blocked with `undefined` rather than the message: on a leaf the message would join
// the union of widget names and spoil the spelling suggestion TypeScript offers there.
type ShapeMarkers<TValue> = {
  widget?: undefined
  fields?: IsLevel<TValue> extends true ? OneShape : NotALevel
  item?: IsArray<TValue> extends true ? OneShape : NotAnArray
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

// A tuple is no array entry: its length is fixed, so items cannot be added or removed.
type IsArray<TValue> = unknown extends TValue
  ? false
  : NonNullable<TValue> extends readonly unknown[]
    ? number extends NonNullable<TValue>['length']
      ? true
      : false
    : false

type ItemOf<TValue> = NonNullable<TValue> extends readonly (infer TItem)[] ? TItem : never

// A part of an optional or nullable object may be missing at runtime, whatever its own level
// declares.
type PartOf<TValue, TKey extends keyof NonNullable<TValue>> = undefined extends TValue
  ? NonNullable<TValue>[TKey] | undefined
  : null extends TValue
    ? NonNullable<TValue>[TKey] | undefined
    : NonNullable<TValue>[TKey]

type Level<TParts extends ConfigParts, TValue, TValues> = {
  [Key in keyof NonNullable<TValue>]?: FieldEntry<
    TParts,
    PartOf<TValue, Key>,
    TValues,
    NonNullable<TValue>[Key]
  >
}

type LeafShape<TParts extends ConfigParts, TValue, TValues, TDeclared> = LeafEntry<
  TParts['widgets'],
  TValue,
  TValues,
  TDeclared
> &
  Owns<'widget', TValue>

// Until createForm reads the config written, a layout may name any key of its object, described
// in `fields` or not.
type ObjectShape<TParts extends ConfigParts, TValue, TValues> = {
  fields: Level<TParts, TValue, TValues>
  layout?: LayoutEntry<TParts, keyof NonNullable<TValue> & string, TValues>[]
} & Owns<'fields', TValue>

// Without a registered frame the bare default renders the items, which takes no props.
type FrameProps<TStructure> = 'arrayFrame' extends keyof TStructure
  ? ExtraProps<
      NonNullable<TStructure['arrayFrame' & keyof TStructure]>,
      keyof ArrayFrameProps<unknown>
    >
  : Record<never, never>

type ArrayShape<TParts extends ConfigParts, TValue, TValues> = {
  item: FieldEntry<TParts, ItemOf<TValue>, TValues>
  newItem: () => ItemOf<TValue>
  addLabel: string
  removeLabel: string | ((item: ItemOf<TValue>, index: number) => string)
  itemKey?: (item: ItemOf<TValue>) => string | number
} & PropsEntry<FrameProps<TParts['structure']>, TValues> &
  Owns<'item', TValue>

type CustomShape<TValue> = {
  render: (field: FieldApiOf<TValue>) => ReactNode
} & Owns<'render', TValue>

/**
 * One entry under `fields`, for a value of type `TValue` in a form whose values are `TValues`, with
 * the widgets and slots of `TParts`: a leaf (`widget`), an object (`fields`), an array (`item`) or a
 * custom entry (`render`), each with the options every entry shares; an array leaves `mode` to the
 * renderer. An entry has exactly one of these shapes. `TDeclared` is the value type its own level
 * declares; it differs from `TValue` only below an optional or nullable object.
 */
export type FieldEntry<TParts extends ConfigParts, TValue, TValues, TDeclared = TValue> =
  | (FieldEntryOptions<TValue, TValues> &
      (
        | LeafShape<TParts, TValue, TValues, TDeclared>
        | (IsLevel<TValue> extends true ? ObjectShape<TParts, TValue, TValues> : never)
        | CustomShape<TValue>
      ))
  | (IsArray<TValue> extends true
      ? Omit<FieldEntryOptions<TValue, TValues>, 'mode'> & ArrayShape<TParts, TValue, TValues>
      : never)
