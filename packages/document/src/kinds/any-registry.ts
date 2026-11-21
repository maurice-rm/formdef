import type { Registry } from '@formdef/core'

/** A registry of any widgets, form components and structure slots, as a kind is defined with. */
// biome-ignore lint/suspicious/noExplicitAny: a registry of any widgets, form components and slots.
export type AnyRegistry = Registry<any, any, any>
