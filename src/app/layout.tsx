import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import type { ReactNode } from 'react'
import { analytics, site } from '@/config'
import '@/styles/global.css'

export const metadata: Metadata = {
  title: site.title,
  description: site.description,
  icons: { icon: site.logo },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={site.lang}>
      <body>
        {children}
        {analytics !== null && <Script src={analytics.src} data-website-id={analytics.websiteId} />}
      </body>
    </html>
  )
}
