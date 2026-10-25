const IMPORT = /^\s*(?:import|export)\b(?:[^'"]*?\bfrom)?\s*['"]([^'"]+)['"]/gm

/** The module specifiers `source` imports or re-exports from, in order of appearance. */
export const importsOf = (source: string): string[] =>
  [...source.matchAll(IMPORT)].flatMap(([, specifier]) =>
    specifier === undefined ? [] : [specifier],
  )
