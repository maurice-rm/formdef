import type { Answers } from '../evaluate/answers'
import { resolveSettings } from '../evaluate/resolve-settings'
import type { FieldItem } from '../form-document'
import type { Setting } from '../kinds/setting'
import { withFormattedTexts } from './with-formatted-texts'

type PropsBuilder = {
  readonly settings: Readonly<Record<string, Setting<unknown>>>
  props: (settings: Readonly<Record<string, unknown>>) => Readonly<Record<string, unknown>>
}

/**
 * The props a field, block or display kind builds from the settings of one of its owners, those
 * settings resolved for the answers in a language and their formatted texts rendered.
 */
export function kindPropsOf(
  owner: Pick<FieldItem, 'settings'>,
  kind: PropsBuilder,
  context: { answers: Answers; language: string | undefined },
): Readonly<Record<string, unknown>> {
  return kind.props(withFormattedTexts(resolveSettings(owner, kind, context), kind))
}
