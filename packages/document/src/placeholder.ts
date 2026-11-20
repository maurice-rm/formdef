// `{{` and `}}` write a brace; `{key}` names the answer of a field, a key holding no space or
// brace. A lone brace, and braces around a space, stay as they are.
export const PLACEHOLDER: RegExp = /\{\{|\}\}|\{([^{}\s]+)\}/g
