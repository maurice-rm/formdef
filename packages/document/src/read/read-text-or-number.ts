import { failAt } from '../fail-at'

export function readTextOrNumber(value: unknown, path: string): string | number {
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))
    ? value
    : failAt(path, 'expected text or a number.')
}
