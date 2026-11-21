import { failAt } from '../fail-at'
import { isPlainObject } from '../is-plain-object'
import type { ReadLimits } from './read-limits'

// Keys that reach an object's prototype once a document is spread or merged.
const REFUSED_KEYS: ReadonlySet<string> = new Set(['__proto__', 'constructor', 'prototype'])

type Walk = { limits: Pick<ReadLimits, 'depth' | 'textLength'>; depth: number; path: string }

const checkValue = (value: unknown, walk: Walk): void => {
  const { limits, depth, path } = walk
  if (typeof value === 'string' && value.length > limits.textLength) {
    failAt(path, `longer than ${limits.textLength} characters (limit textLength).`)
  }
  if (!Array.isArray(value) && !isPlainObject(value)) {
    return
  }
  if (depth > limits.depth) {
    failAt(path, `nested more than ${limits.depth} levels deep (limit depth).`)
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      checkValue(entry, { limits, depth: depth + 1, path: `${path}[${index}]` })
    })
    return
  }
  for (const [key, entry] of Object.entries(value)) {
    const entryPath = `${path}.${key}`
    if (REFUSED_KEYS.has(key)) {
      failAt(entryPath, `the key "${key}" is not allowed.`)
    }
    checkValue(entry, { limits, depth: depth + 1, path: entryPath })
  }
}

/**
 * Checks raw input before its shape is read: that it nests no deeper than the limit, holds no text
 * longer than the limit, and no key that reaches an object's prototype, anywhere.
 *
 * @throws At the first place beyond a limit or with a refused key.
 */
export function checkInput(
  input: unknown,
  { limits, path }: { limits: ReadLimits; path: string },
): void {
  checkValue(input, { limits, depth: 1, path })
}
