/**
 * The path of `key` below `parent`: a key of the root level by itself, a key of a nested level
 * after a dot, the index of an array item in brackets.
 */
export function childPath(parent: string | undefined, key: string | number): string {
  if (typeof key === 'number') {
    return `${parent ?? ''}[${key}]`
  }

  return parent === undefined ? key : `${parent}.${key}`
}
