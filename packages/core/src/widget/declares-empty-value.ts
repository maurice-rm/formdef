/** Whether `widget` declares its empty value, the value it holds while nothing is entered. */
export function declaresEmptyValue(widget: object): widget is { emptyValue: unknown } {
  return Object.hasOwn(widget, 'emptyValue')
}
