import { failAt } from '../fail-at'

export function readOneOf<TValue extends string>(
  value: unknown,
  choices: readonly TValue[],
  path: string,
): TValue {
  return choices.includes(value as TValue)
    ? (value as TValue)
    : failAt(path, `expected one of ${choices.join(', ')}.`)
}
