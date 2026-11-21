import { failAt } from '../fail-at'
import { isLanguageCode } from '../is-language-code'
import { LANGUAGE_CODE_EXPECTED } from '../language-code-expected'

export function readLanguageCode(value: unknown, path: string): string {
  return isLanguageCode(value) ? value : failAt(path, LANGUAGE_CODE_EXPECTED)
}
