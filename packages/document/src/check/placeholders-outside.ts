import { placeholdersOf } from '../placeholders-of'
import type { Text } from '../text'
import { translationsOf } from '../translations-of'

/** A placeholder a text may not hold, with the path of the translation it sits in. */
type PlacedPlaceholder = { placeholder: string; path: string }

/** The placeholders of a text, in each translation, but those it is allowed. */
export function placeholdersOutside(
  text: Text,
  { path, allowed }: { path: string; allowed: readonly string[] },
): PlacedPlaceholder[] {
  return translationsOf(text, path).flatMap((translation) =>
    placeholdersOf(translation.text)
      .filter((placeholder) => !allowed.includes(placeholder))
      .map((placeholder) => ({ placeholder, path: translation.path })),
  )
}
