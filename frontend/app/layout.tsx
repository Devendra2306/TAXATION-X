import './globals.css'
import { Plus_Jakarta_Sans } from 'next/font/google'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

export const metadata = {
  title: 'NexTax — Smart Tax Filing Platform',
  description: 'India\'s most trusted platform for ITR filing, tax optimization, and maximum refunds.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${plusJakarta.className} gradient-mesh antialiased`}>{children}</body>
    </html>
  )
}
