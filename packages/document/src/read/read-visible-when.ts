import type { Condition } from '../condition'
import { pathTo } from '../path-to'
import { readCondition } from './read-condition'
import type { Shape } from './read-shape'
import { withOptional } from './with-optional'

export function readVisibleWhen(
  shape: Shape,
  path: string,
): Partial<Record<'visibleWhen', Condition>> {
  return withOptional(
    'visibleWhen',
    shape.visibleWhen === undefined
      ? undefined
      : readCondition(shape.visibleWhen, pathTo.visibleWhen(path)),
  )
}
