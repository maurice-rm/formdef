import type { FieldItem } from '../form-document'
import { ISSUE_PARAM_NAMES, type IssueParams, LABEL_PARAM } from '../issue-params'
import { placeholdersOf } from '../placeholders-of'
import type { Text } from '../text'
import { translationsOf } from '../translations-of'
import { checkTranslations } from './check-translations'
import { checkVaryingText } from './check-varying-text'
import type { CheckWalk } from './check-walk'
import { report } from './report'

type At = { walk: CheckWalk; path: string }

const isKnownCode = (code: string): code is keyof IssueParams =>
  Object.hasOwn(ISSUE_PARAM_NAMES, code)

// The params of a project's own code are its rule's, which the document cannot know.
const checkParams = (text: Text, { at, code }: { at: At; code: string }): void => {
  if (!isKnownCode(code)) {
    return
  }
  const known = [LABEL_PARAM, ...ISSUE_PARAM_NAMES[code]]
  for (const translation of translationsOf(text, at.path)) {
    for (const param of placeholdersOf(translation.text)) {
      if (!known.includes(param)) {
        report(at.walk, { code: 'unknownParam', path: translation.path, params: { param, code } })
      }
    }
  }
}

/**
 * Checks a field's own error texts: each against the document's languages, the conditions of a
 * text that follows an answer, and its placeholders against the params its code names.
 */
export function checkMessages(field: FieldItem, { walk, path }: At): void {
  for (const [code, text] of Object.entries(field.messages ?? {})) {
    checkVaryingText(text, { walk, path: `${path}.messages.${code}` }, (plain, at) => {
      checkTranslations(plain, at)
      checkParams(plain, { at, code })
    })
  }
}
