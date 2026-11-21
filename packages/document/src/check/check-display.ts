import type { Display } from '../form-document'
import type { DisplayTarget } from '../kinds/display-kind'
import { checkFixedText } from './check-fixed-text'
import { checkSettings } from './check-settings'
import type { CheckWalk } from './check-walk'
import { report } from './report'

/**
 * Checks the display of the form, a step, a section, a row or a repeat: a registered kind that
 * applies to `target`, with settings that fit it and texts that name no answers. The display of a
 * form without steps is checked with the target `undefined`, which no kind applies to.
 */
export function checkDisplay(
  display: Display | undefined,
  target: DisplayTarget | undefined,
  { walk, path }: { walk: CheckWalk; path: string },
): void {
  if (display === undefined) {
    return
  }
  const displayPath = `${path}.display`
  const kind = walk.displayKindNamed(display.kind)
  if (kind === undefined) {
    report(walk, {
      code: 'unknownKind',
      path: `${displayPath}.kind`,
      params: { kind: display.kind },
    })
    return
  }
  if (kind.appliesTo !== target) {
    report(walk, {
      code: 'misplacedDisplay',
      path: `${displayPath}.kind`,
      params: { kind: display.kind, appliesTo: kind.appliesTo },
    })
    return
  }
  checkSettings({ key: display.kind, ...display }, kind, {
    walk,
    path: displayPath,
    checkTextOf: checkFixedText,
  })
}
