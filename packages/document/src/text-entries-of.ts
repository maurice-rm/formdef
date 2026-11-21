// A case's condition holds no text; an option's value is a key that stored answers and conditions
// name, so renaming a placeholder inside it would cut them off.
const CASE_CONDITION = 'when'
const OPTION_VALUE = 'value'
const OPTION_LABEL = 'label'

/** The entries of an object of a document that may hold texts, leaving out conditions and keys. */
export function textEntriesOf(value: Readonly<Record<string, unknown>>): [string, unknown][] {
  const isOption = Object.hasOwn(value, OPTION_LABEL)
  return Object.entries(value).filter(
    ([key]) => key !== CASE_CONDITION && !(isOption && key === OPTION_VALUE),
  )
}
