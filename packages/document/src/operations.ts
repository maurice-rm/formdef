type ArithmeticOperation = 'add' | 'subtract' | 'multiply' | 'divide' | 'min' | 'max'

/** The operations of an expression on numbers among its operands. */
export const ARITHMETIC_OPERATIONS: readonly ArithmeticOperation[] = [
  'add',
  'subtract',
  'multiply',
  'divide',
  'min',
  'max',
]

/** The operations of an expression on its operands: arithmetic and the others. */
export const OPERAND_OPERATIONS: readonly (
  | ArithmeticOperation
  | 'round'
  | 'otherwise'
  | 'concat'
  | 'daysBetween'
)[] = [...ARITHMETIC_OPERATIONS, 'round', 'otherwise', 'concat', 'daysBetween']

/** The operations of an expression over a number field of a repeat, across its entries. */
export const ACROSS_ENTRIES_OPERATIONS: readonly ('sum' | 'min' | 'max')[] = ['sum', 'min', 'max']

/** The operations of an expression on a field's choices; `count` also counts a repeat's entries. */
export const CHOICE_OPERATIONS: readonly ('count' | 'score')[] = ['count', 'score']

/** The operation that counts the entries of a repeat whose condition holds. */
export const COUNT_WHERE = 'countWhere'

/** Whether an operation's name is one of these. */
export function isOperationIn<TName extends string>(
  names: readonly TName[],
  op: string,
): op is TName {
  return (names as readonly string[]).includes(op)
}
