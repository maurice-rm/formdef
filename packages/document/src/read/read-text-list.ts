import { failAt } from '../fail-at'

export function readTextList(value: unknown, path: string): string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
    ? [...value]
    : failAt(path, 'expected a list of text.')
}
