const DECIMAL_COMMA = ','

/** The number a decimal stands for, written with a comma or a dot, such as `120,5`. */
export function numberOf(value: number | string): number {
  return typeof value === 'number' ? value : Number(value.replace(DECIMAL_COMMA, '.'))
}
