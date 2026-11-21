import { DOCUMENT_PATH } from '../document-path'
import { isLanguageCode } from '../is-language-code'
import type { CheckWalk } from './check-walk'
import { report } from './report'

/** Checks that each language a document names is a language code. */
export function checkLanguages(languages: readonly string[] | undefined, walk: CheckWalk): void {
  languages?.forEach((language, index) => {
    if (!isLanguageCode(language)) {
      report(walk, {
        code: 'invalidLanguage',
        path: `${DOCUMENT_PATH}.languages[${index}]`,
        params: { language },
      })
    }
  })
}
