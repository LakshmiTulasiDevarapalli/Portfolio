import type { Metadata } from 'next'
import './globals.css'
import Navigation from '@/components/Navigation'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: 'Portfolio — Resources & Experience',
  description: 'Professional portfolio with curated resources, experience, and contact information.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navigation />
        <main className="min-h-screen pt-20">
          {children}
        </main>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1A1A25',
              color: '#F5F0E8',
              border: '1px solid rgba(200,149,92,0.2)',
              fontFamily: 'Outfit, sans-serif',
            },
          }}
        />
      </body>
    </html>
  )
}
