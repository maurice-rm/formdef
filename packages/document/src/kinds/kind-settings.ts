import type { Setting } from './setting'

/** The settings of a field, block or display kind, by name. */
export type KindSettings = Readonly<Record<string, Setting<unknown>>>
