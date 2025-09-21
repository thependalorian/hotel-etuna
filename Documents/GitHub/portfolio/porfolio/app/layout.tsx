import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'George Nekwaya - AI Product Manager & Business Strategist',
  description: 'Portfolio of George Nekwaya - Global tech leader, entrepreneur, and innovator.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="dark">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-blue-500/20">
          {children}
        </div>
      </body>
    </html>
  )
} 