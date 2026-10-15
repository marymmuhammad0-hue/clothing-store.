import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'

const cairo = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-cairo' })

const SITE_TITLE = 'fashion-store'
const SITE_DESCRIPTION = 'ملابس كاجوال عصرية'
const SITE_IMAGE = 'https://i.ibb.co/sJp8k2JP/coffee.jpg'

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  generator: 'v0.app',
  icons: {
    icon: [{ url: SITE_IMAGE, type: 'image/jpeg' }],
    shortcut: SITE_IMAGE,
    apple: SITE_IMAGE,
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: 'website',
    locale: 'ar_EG',
    siteName: 'fashion-store',
    images: [{ url: SITE_IMAGE, alt: 'شعار قهوة بريميوم - Premium Quality Coffee' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [SITE_IMAGE],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
