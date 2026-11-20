type PathTo = {
  /** The step or item at an index of a list, such as `document.steps[0]`. */
  entry: (path: string, list: 'steps' | 'items' | 'endings', index: number) => string
  /** The visibility condition of a step or item. */
  visibleWhen: (path: string) => string
  /** The required condition of a field. */
  required: (path: string) => string
  /** A setting of a field, by name. */
  setting: (path: string, name: string) => string
  /** A case of a setting that follows an answer. */
  case: (settingPath: string, index: number) => string
  /** The condition of a case of a setting that follows an answer. */
  caseWhen: (settingPath: string, index: number) => string
}

const casePath = (settingPath: string, index: number): string => `${settingPath}.cases[${index}]`

/** The paths of the places in a form document that hold conditions, from their owner's path. */
export const pathTo: PathTo = {
  entry: (path, list, index) => `${path}.${list}[${index}]`,
  visibleWhen: (path) => `${path}.visibleWhen`,
  required: (path) => `${path}.required`,
  setting: (path, name) => `${path}.settings.${name}`,
  case: casePath,
  caseWhen: (settingPath, index) => `${casePath(settingPath, index)}.when`,
}
