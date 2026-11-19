import type { Metadata, Viewport } from 'next'
import { Geist_Mono, Inter_Tight } from 'next/font/google'
import './globals.css'

// The Ursa Minor site's faces: Inter Tight 200 for display, Geist Mono for
// labels and data. Body text is Helvetica, from the system, in globals.css.
const interTight = Inter_Tight({ subsets: ['latin'], weight: ['200', '300'], variable: '--font-inter-tight' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Ursa',
  description: 'The overlay: what Ursa read, learned, and resolved, live over your terminal.',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#020308',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${interTight.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  )
}
