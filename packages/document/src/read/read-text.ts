import { failAt } from '../fail-at'

export function readText(value: unknown, path: string): string {
  return typeof value === 'string' && value !== '' ? value : failAt(path, 'expected text.')
}
