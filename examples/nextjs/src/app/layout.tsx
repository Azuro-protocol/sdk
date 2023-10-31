import '@rainbow-me/rainbowkit/styles.css'
import './globals.css'
import { Providers, Header, Watchers } from '@/components'


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
          <Watchers />
        </Providers>
      </body>
    </html>
  )
}
