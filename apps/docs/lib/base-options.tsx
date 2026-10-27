import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'

import { BrandName } from '@/components/brand-name'
import { githubUrl } from './github-url'

export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: <BrandName />,
      url: '/',
    },
    githubUrl,
  }
}
