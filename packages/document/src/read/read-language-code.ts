import { failAt } from '../fail-at'

// A BCP 47 tag of a language and its subtags, such as `de`, `de-CH` or `zh-Hant`.
const LANGUAGE_CODE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/

export function readLanguageCode(value: unknown, path: string): string {
  return typeof value === 'string' && LANGUAGE_CODE.test(value)
    ? value
    : failAt(path, 'expected a language code, such as "de" or "de-CH".')
}
