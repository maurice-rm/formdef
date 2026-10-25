import type { AnyFieldApi } from '@tanstack/react-form'
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

const removeLabelOf = (removeLabel: unknown, item: unknown, index: number): string =>
  typeof removeLabel === 'function'
    ? (removeLabel as ItemFunction<string>)(item, index)
    : String(removeLabel)

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
  const items: unknown[] = Array.isArray(field.state.value) ? field.state.value : []
  const newItem = options.newItem as () => unknown
  const keys = items.map((item, index) =>
    typeof options.itemKey === 'function'
      ? (options.itemKey as ItemFunction<string | number>)(item)
      : index,
  )
  const addLabel = String(options.addLabel)
  const removeLabels = items.map((item, index) => removeLabelOf(options.removeLabel, item, index))
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
