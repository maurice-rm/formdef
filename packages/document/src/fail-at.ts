/**
 * Throws the error of a form document at a place in it, as every error of the package reads:
 * `formdef: <where>: <problem>`.
 *
 * @throws Always.
 */
export function failAt(where: string, problem: string): never {
  throw new Error(`formdef: ${where}: ${problem}`)
}
