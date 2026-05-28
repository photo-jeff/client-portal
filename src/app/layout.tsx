import type { Metadata } from 'next'
import { Cinzel, Prata, Inter } from 'next/font/google'
import './globals.css'

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-display',
})

const prata = Prata({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-serif',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Jeff Oliver Photography | Client Portal',
  description: 'Your personal wedding portal',
  icons: {
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'JOP Portal',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cinzel.variable} ${prata.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  )
}
