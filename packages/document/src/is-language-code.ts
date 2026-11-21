// A BCP 47 tag of a language and its subtags, such as `de`, `de-CH` or `zh-Hant`.
const LANGUAGE_CODE = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/

const isKnownToIntl = (code: string): boolean => {
  try {
    Intl.getCanonicalLocales(code)
    return true
  } catch (error) {
    if (error instanceof RangeError) {
      return false
    }
    throw error
  }
}

/** Whether a value is a language code that texts are translated into and numbers written in. */
export function isLanguageCode(value: unknown): value is string {
  return typeof value === 'string' && LANGUAGE_CODE.test(value) && isKnownToIntl(value)
}
