import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import type { ReactNode } from 'react'
import { ANALYTICS, SITE } from '@/config'
import '@/styles/global.css'

export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
  icons: { icon: SITE.logo },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang={SITE.lang}>
      <body>
        {children}
        {ANALYTICS !== null && <Script src={ANALYTICS.src} data-website-id={ANALYTICS.websiteId} />}
      </body>
    </html>
  )
}
