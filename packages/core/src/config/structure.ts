import type { ReactNode } from 'react'

import type { FieldApiOf } from '../widget/field-of'

/**
 * The props a registered `structure.section` component receives: the title of a section layout
 * entry and the entries it groups. Props the entry passes under `props` come on top.
 *
 * @example
 * ```tsx
 * const Section = ({ label, children }: SectionProps) => (
 *   <fieldset>
 *     <legend>{label}</legend>
 *     {children}
 *   </fieldset>
 * )
 * ```
 */
export interface SectionProps {
  /** The title the section entry names. */
  label: string
  /** The rendered entries of the section. */
  children: ReactNode
}

/**
 * The props a registered `structure.row` component receives: the entries it places side by side.
 * Props the entry passes under `props` come on top.
 *
 * @example
 * ```tsx
 * const Row = ({ children }: RowProps) => <div className="grid grid-cols-2 gap-4">{children}</div>
 * ```
 */
export interface RowProps {
  /** The rendered entries of the row. */
  children: ReactNode
}

/**
 * The props a registered `structure.body` component receives: everything a generated form
 * renders inside its `<form>` element.
 *
 * @example
 * ```tsx
 * const Body = ({ children }: BodyProps) => <div className="flex flex-col gap-6">{children}</div>
 * ```
 */
export interface BodyProps {
  /** The rendered fields and layout of the form. */
  children: ReactNode
}

/**
 * The props a registered `structure.arrayFrame` component receives: the array field, a renderer
 * for each item, the labels of its controls and the operations that change the array. Props the
 * array entry passes under `props` come on top.
 *
 * @typeParam TItem - The type of one item of the array.
 * @typeParam TExtra - The props a frame hands to an item's widget through `renderItem`; none by
 *   default.
 *
 * @example
 * ```tsx
 * const ArrayFrame = <TItem,>({ keys, renderItem, add, remove, addLabel, removeLabels }: ArrayFrameProps<TItem>) => (
 *   <ul>
 *     {keys.map((key, index) => (
 *       <li key={key}>
 *         {renderItem(index)}
 *         <button type="button" onClick={() => remove(index)}>{removeLabels[index]}</button>
 *       </li>
 *     ))}
 *     <button type="button" onClick={add}>{addLabel}</button>
 *   </ul>
 * )
 * ```
 */
export interface ArrayFrameProps<TItem, TExtra = never> {
  /**
   * The array field itself, where an error about the whole list, such as its length, is reported.
   * It renders in TanStack's array mode: the frame renders again when items are added, removed or
   * moved, when its keys or remove labels change, and when the list's meta changes, not when a value
   * inside an item does. A frame that shows values of its items subscribes to them itself.
   */
  field: FieldApiOf<TItem[]>
  /** One key per item, by the entry's `itemKey` or by position. */
  keys: readonly (string | number)[]
  /**
   * Renders the item at `index`.
   *
   * @param index - The position of the item.
   * @param extra - Props for the item's widget, when the item is a single leaf or an object
   *   level with one field and no layout.
   */
  renderItem: (index: number, extra?: TExtra) => ReactNode
  /** The accessible name of the add control. */
  addLabel: string
  /** The accessible name of each item's remove control, one per item. */
  removeLabels: readonly string[]
  /** Appends a new item, built by the entry's `newItem`. */
  add: () => void
  /** Removes the item at `index`. */
  remove: (index: number) => void
  /** Inserts `item` at `index`, or a new item built by the entry's `newItem`. */
  insert: (index: number, item?: TItem) => void
  /** Moves the item at `from` to `to`. */
  move: (from: number, to: number) => void
  /** Swaps the items at `first` and `second`. */
  swap: (first: number, second: number) => void
  /** Replaces the item at `index` with `item`. */
  replace: (index: number, item: TItem) => void
  /** Removes every item. */
  clear: () => void
}
