// Bundlers replace `process.env.NODE_ENV` in exactly this spelling; without one, `process` may not
// exist at all.
// biome-ignore lint/style/useNamingConvention: the name bundlers replace.
declare const process: { env: { NODE_ENV?: string } } | undefined

const warnedOwners = new WeakSet<object>()

const isProduction = (): boolean =>
  typeof process !== 'undefined' && process.env.NODE_ENV === 'production'

/** Warns once per `owner`, and never in production. */
export function warnOnce(owner: object, message: string): void {
  if (isProduction() || warnedOwners.has(owner)) {
    return
  }

  warnedOwners.add(owner)
  console.warn(message)
}
