import type { Compatible, FieldOf } from '../widget/field-of'
import type { ExtraProps } from './extra-props'
import type { PropsEntry } from './props-entry'

type WidgetSupplied = keyof FieldOf<unknown>

// On an optional path a widget's `required` can only be `false`, so the config cannot claim what
// the schema does not demand. A mapped type keeps the prop optional or required as the widget
// declares it, and adds nothing to a widget without one.
type RequiredFollowsSchema<TProps, TValue> = undefined extends TValue
  ? { [Key in keyof TProps]: Key extends 'required' ? Extract<TProps[Key], false> : TProps[Key] }
  : TProps

type LeafFor<TWidgets, TName extends keyof TWidgets, TDeclared, TValues> = {
  widget: TName
} & PropsEntry<
  RequiredFollowsSchema<ExtraProps<TWidgets[TName], WidgetSupplied>, TDeclared>,
  TValues
>

/**
 * A field entry that renders its value with a registered widget: `widget` names one whose value
 * type serves `TValue`, and `props` follows that widget. Whether `required` may be claimed follows
 * `TDeclared`, the value type its own level declares, which a part of an optional or nullable object keeps.
 */
export type LeafEntry<TWidgets, TValue, TValues, TDeclared = TValue> = {
  [Name in Compatible<TWidgets, TValue>]: LeafFor<TWidgets, Name, TDeclared, TValues>
}[Compatible<TWidgets, TValue>]
