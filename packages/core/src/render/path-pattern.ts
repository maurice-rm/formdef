const ITEM_INDEX = /\[\d+\]/g
const ANY_ITEM = '[]'

/** The path with every array index left open: `contacts[2].name` becomes `contacts[].name`. */
export function pathPattern(path: string): string {
  return path.replaceAll(ITEM_INDEX, ANY_ITEM)
}
