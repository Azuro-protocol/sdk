import '@rainbow-me/rainbowkit/styles.css'
import './globals.css'
import { Providers, Header } from '@/components'


export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main className="container pt-5 pb-10">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
