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

type LeafFor<TWidgets, TName extends keyof TWidgets, TValue, TValues> = {
  widget: TName
} & PropsEntry<RequiredFollowsSchema<ExtraProps<TWidgets[TName], WidgetSupplied>, TValue>, TValues>

/**
 * A field entry that renders its value with a registered widget: `widget` names one whose value
 * type serves `TValue`, and `props` follows that widget.
 */
export type LeafEntry<TWidgets, TValue, TValues> = {
  [Name in Compatible<TWidgets, TValue>]: LeafFor<TWidgets, Name, TValue, TValues>
}[Compatible<TWidgets, TValue>]
