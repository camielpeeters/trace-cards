import './globals.css'
import { Providers } from './components/Providers'

export const metadata = {
  title: 'PokéCard Verkoop',
  description: 'Verkoop je Pokemon kaarten snel & makkelijk!',
}

export default function RootLayout({ children }) {
  return (
    <html lang="nl" suppressHydrationWarning>
      <body className="transition-colors duration-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
