import type { CheckWalk } from './check-walk'
import type { FoundProblem, ProblemCode, ProblemParams } from './problem'

type ParamsPart<TCode extends ProblemCode> = [keyof ProblemParams[TCode]] extends [never]
  ? { params?: never }
  : { params: ProblemParams[TCode] }

/** Records a problem the check found, with the params its code names. */
export function report<TCode extends ProblemCode>(
  walk: CheckWalk,
  problem: { code: TCode; path: string } & ParamsPart<TCode>,
): void {
  // Each code's params are checked by `ParamsPart`; the union cannot follow a generic code.
  walk.problems.push({ ...problem, params: problem.params ?? {} } as FoundProblem)
}
