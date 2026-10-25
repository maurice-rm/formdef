import type { ComponentType } from 'react'

type ReactReservedProps = 'key' | 'ref'

type PropsOf<TComponent> = TComponent extends ComponentType<infer TProps> ? TProps : never

// A mapped type rather than `Omit`, which turns every named prop into an index-signature value
// when the props carry a `string` index signature.
type DistributiveOmit<TType, TKey extends PropertyKey> = TType extends unknown
  ? { [Key in keyof TType as Key extends TKey ? never : Key]: TType[Key] }
  : never

/**
 * The props a config passes to a component: all of its props except those the renderer supplies
 * (`TSupplied`), `key` and `ref`. A union of prop shapes stays a union.
 */
export type ExtraProps<TComponent, TSupplied extends PropertyKey> = DistributiveOmit<
  PropsOf<TComponent>,
  TSupplied | ReactReservedProps
>
