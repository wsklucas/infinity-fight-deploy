import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Infinity Fight',
  description: 'Plataforma de Ensino de Muay Thai Competitivo',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-surface-base text-text-primary min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
