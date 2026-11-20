import type { CheckWalk } from './check-walk'
import type { Problem, ProblemCode } from './problem'

export function report(
  walk: CheckWalk,
  problem: { code: ProblemCode; path: string; params?: Problem['params'] },
): void {
  walk.problems.push({ ...problem, params: problem.params ?? {} })
}
