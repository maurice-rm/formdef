type StepsOnly = 'formdef: a root layout that holds a step holds only steps'

type Step = { step: unknown }

type IsMixed<TEntry> = [Extract<TEntry, Step>] extends [never]
  ? false
  : [Exclude<TEntry, Step>] extends [never]
    ? false
    : true

/**
 * Checks the root `layout` of a config written as `TConfig`: a layout that holds a step and any
 * other entry turns into a message saying that it holds only steps.
 */
export type StepsOnlyLayout<TConfig> = TConfig extends { layout: readonly (infer TEntry)[] }
  ? IsMixed<TEntry> extends true
    ? { layout: StepsOnly }
    : unknown
  : unknown
