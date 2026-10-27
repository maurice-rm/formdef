import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import type { ReactNode } from 'react'

import { Provider } from '@/components/provider'
import { appName } from '@/lib/app-name'
import { siteUrl } from '@/lib/site-url'
import './global.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: appName, template: `%s · ${appName}` },
}

export default function Layout({ children }: { children: ReactNode }): ReactNode {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col">
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}
