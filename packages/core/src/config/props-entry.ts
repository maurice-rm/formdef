import type { ExtraProps } from './extra-props'

type KeysOfEach<TType> = TType extends unknown ? keyof TType : never

type HasNoKeys<TType> = [KeysOfEach<TType>] extends [never] ? true : false

type PropsInput<TProps, TValues> = TProps | ((values: TValues) => TProps)

/**
 * The `props` key of an entry that renders `TComponent`: absent when the component takes no props
 * of its own, optional when it renders without them, required otherwise. Either an object or a
 * function of the form's values.
 */
export type PropsEntry<TComponent, TSupplied extends PropertyKey, TValues> =
  HasNoKeys<ExtraProps<TComponent, TSupplied>> extends true
    ? { props?: never }
    : Record<never, never> extends ExtraProps<TComponent, TSupplied>
      ? { props?: PropsInput<ExtraProps<TComponent, TSupplied>, TValues> }
      : { props: PropsInput<ExtraProps<TComponent, TSupplied>, TValues> }
