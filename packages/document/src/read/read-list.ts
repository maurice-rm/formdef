import { failAt } from '../fail-at'

export function readList(value: unknown, path: string): unknown[] {
  return Array.isArray(value) ? value : failAt(path, 'expected a list.')
}
