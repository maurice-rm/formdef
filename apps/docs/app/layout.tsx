import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { Provider } from '@/components/provider'
import { appName } from '@/lib/app-name'
import { siteUrl } from '@/lib/site-url'
import './global.css'

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: appName, template: `%s · ${appName}` },
}

export default function Layout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}
