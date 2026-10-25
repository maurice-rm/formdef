import { type AnyFieldApi, useSelector } from '@tanstack/react-form'
import { type ComponentType, Fragment, type ReactNode } from 'react'

// biome-ignore lint/suspicious/noExplicitAny: a registered frame takes props of its own; the config types check them.
type AnyProps = any

/** The keys of an array entry the renderer reads besides its item. */
type ArrayOptions = {
  newItem?: unknown
  addLabel?: unknown
  removeLabel?: unknown
  itemKey?: unknown
}

type ArrayEntryProps = {
  /** The array field, mounted at the entry's path. */
  field: AnyFieldApi
  options: ArrayOptions
  /** The registered `structure.arrayFrame`, if any. */
  frame: ComponentType<AnyProps> | undefined
  /** The entry's props for the frame. */
  props: object | undefined
  renderItem: (index: number, extra?: object) => ReactNode
}

type ItemFunction<TResult> = (item: unknown, index?: number) => TResult

/** What the controls of an array entry show: one key and one remove label per item. */
type ItemControls = {
  keys: (string | number)[]
  removeLabels: string[]
}

const removeLabelOf = (removeLabel: unknown, item: unknown, index: number): string =>
  typeof removeLabel === 'function'
    ? (removeLabel as ItemFunction<string>)(item, index)
    : String(removeLabel)

const itemControlsOf = (options: ArrayOptions, value: unknown): ItemControls => {
  const items: unknown[] = Array.isArray(value) ? value : []

  return {
    keys: items.map((item, index) =>
      typeof options.itemKey === 'function'
        ? (options.itemKey as ItemFunction<string | number>)(item)
        : index,
    ),
    removeLabels: items.map((item, index) => removeLabelOf(options.removeLabel, item, index)),
  }
}

const isSameList = <TItem,>(first: readonly TItem[], second: readonly TItem[]): boolean =>
  first.length === second.length && first.every((item, index) => item === second[index])

const isSameControls = (first: ItemControls, second: ItemControls): boolean =>
  isSameList(first.keys, second.keys) && isSameList(first.removeLabels, second.removeLabels)

/**
 * Renders an array entry: through the registered frame, which receives `ArrayFrameProps`, or as
 * the bare default, each item followed by its remove button and one add button at the end.
 */
export const ArrayEntry = ({
  field,
  options,
  frame: Frame,
  props,
  renderItem,
}: ArrayEntryProps): ReactNode => {
  // The field renders in TanStack's array mode, so only a change to the list reaches it; keys and
  // labels that name an item follow the items through a selection of their own.
  const { keys, removeLabels } = useSelector(
    field.store,
    (state: { value: unknown }) => itemControlsOf(options, state.value),
    { compare: isSameControls },
  )
  const newItem = options.newItem as () => unknown
  const addLabel = String(options.addLabel)
  const add = (): void => field.pushValue(newItem())
  const remove = (index: number): void => field.removeValue(index)

  if (Frame === undefined) {
    return (
      <>
        {keys.map((key, index) => (
          <Fragment key={key}>
            {renderItem(index)}
            <button type="button" data-formdef-remove="" onClick={() => remove(index)}>
              {removeLabels[index]}
            </button>
          </Fragment>
        ))}
        <button type="button" data-formdef-add="" onClick={add}>
          {addLabel}
        </button>
      </>
    )
  }

  return (
    <Frame
      {...props}
      field={field}
      keys={keys}
      renderItem={renderItem}
      addLabel={addLabel}
      removeLabels={removeLabels}
      add={add}
      remove={remove}
      insert={(index: number, item?: unknown) =>
        field.insertValue(index, item === undefined ? newItem() : item)
      }
      move={(from: number, to: number) => field.moveValue(from, to)}
      swap={(first: number, second: number) => field.swapValues(first, second)}
      replace={(index: number, item: unknown) => field.replaceValue(index, item)}
      clear={() => field.clearValues()}
    />
  )
}
