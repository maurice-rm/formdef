import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

import { appName } from './app-name'
import { githubUrl } from './github-url'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: appName,
      url: '/',
    },
    githubUrl,
  }
}
