import type { Rename } from './rename'

/** A key, renamed when it is the one renamed. */
export function renamedKey(key: string, rename: Rename): string {
  return key === rename.from ? rename.to : key
}
