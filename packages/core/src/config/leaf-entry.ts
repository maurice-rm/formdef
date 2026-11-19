import type { Compatible, FieldOf } from '../widget/field-of'
import type { ExtraProps } from './extra-props'
import type { PropsEntry } from './props-entry'

type WidgetSupplied = keyof FieldOf<unknown>

type LeafFor<TWidgets, TName extends keyof TWidgets, TValues> = {
  widget: TName
} & PropsEntry<ExtraProps<TWidgets[TName], WidgetSupplied>, TValues>

/**
 * A field entry that renders its value with a registered widget: `widget` names one whose value
 * type serves `TValue`, and `props` follows that widget.
 */
export type LeafEntry<TWidgets, TValue, TValues> = {
  [Name in Compatible<TWidgets, TValue>]: LeafFor<TWidgets, Name, TValues>
}[Compatible<TWidgets, TValue>]
