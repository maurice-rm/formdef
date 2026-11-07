import { type Context, createContext } from 'react'

export const NO_REQUIRED_PATHS: ReadonlySet<string> = new Set()

/** The path patterns of the required fields of the level being rendered. */
export const RequiredPaths: Context<ReadonlySet<string>> = createContext(NO_REQUIRED_PATHS)
