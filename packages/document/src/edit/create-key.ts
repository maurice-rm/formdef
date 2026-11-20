const KEY_LENGTH = 8
const KEY_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

/**
 * Creates a new key for a step, field or option: the prefix and eight random letters and digits.
 * All keys of one prefix have one length, so none starts another, as step keys must not.
 *
 * @param prefix - What the key starts with, such as `s` for a step or `f` for a field.
 * @returns The key, such as `f3k9x0q2m`.
 *
 * @example
 * ```ts
 * const field = { type: 'field', key: createKey('f'), kind: 'text', label: 'Name' }
 * ```
 */
export const createKey = (prefix: string): string => {
  const random = crypto.getRandomValues(new Uint8Array(KEY_LENGTH))
  return prefix + Array.from(random, (byte) => KEY_ALPHABET[byte % KEY_ALPHABET.length]).join('')
}
