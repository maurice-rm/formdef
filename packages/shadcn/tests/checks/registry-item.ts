/** A file of a registry item, as `registry.json` lists it. */
export type RegistryFile = {
  path: string
  type: string
  target?: string
}

/** An item of `registry.json`, with the keys the checks read. */
export type RegistryItem = {
  name: string
  type: string
  dependencies?: string[]
  registryDependencies?: string[]
  files: RegistryFile[]
}
