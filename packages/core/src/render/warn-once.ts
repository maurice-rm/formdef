// Bundlers replace `process.env.NODE_ENV` in exactly this spelling; without one, `process` may not
// exist at all.
// biome-ignore lint/style/useNamingConvention: the name bundlers replace.
declare const process: { env: { NODE_ENV?: string } } | undefined

const warnedTopics = new WeakMap<object, Set<string>>()

const isProduction = (): boolean =>
  typeof process !== 'undefined' && process.env.NODE_ENV === 'production'

/**
 * Warns once per `owner` and `topic`, so warnings about different things of one owner each show,
 * and never in production.
 */
export function warnOnce(owner: object, topic: string, message: string): void {
  if (isProduction()) {
    return
  }
  const topics = warnedTopics.get(owner) ?? new Set<string>()
  if (topics.has(topic)) {
    return
  }

  topics.add(topic)
  warnedTopics.set(owner, topics)
  console.warn(message)
}
