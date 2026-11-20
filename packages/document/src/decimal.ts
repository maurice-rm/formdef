const DECIMAL_COMMA = ','

/** The number a decimal stands for, written with a comma or a dot, such as `120,5`. */
export const numberOf = (value: number | string): number =>
  typeof value === 'number' ? value : Number(value.replace(DECIMAL_COMMA, '.'))
