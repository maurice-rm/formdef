type KeysOfEach<TType> = TType extends unknown ? keyof TType : never

type HasNoKeys<TType> = [KeysOfEach<TType>] extends [never] ? true : false

type PropsInput<TProps, TValues> = TProps | ((values: TValues) => TProps)

/**
 * The `props` key of an entry whose component takes `TProps` from the config: absent when there
 * are none, optional when the component renders without them, required otherwise. Either an
 * object or a function of the form's values.
 */
export type PropsEntry<TProps, TValues> =
  HasNoKeys<TProps> extends true
    ? { props?: never }
    : Record<never, never> extends TProps
      ? { props?: PropsInput<TProps, TValues> }
      : { props: PropsInput<TProps, TValues> }
