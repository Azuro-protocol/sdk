import '@rainbow-me/rainbowkit/styles.css'
import './globals.css'
import { Providers, Header, Betslip } from '@/components'
import { cookies } from 'next/headers'


export default function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const cookieStore = cookies()

  const initialChainId = cookieStore.get('appChainId')
  const initialLiveState = JSON.parse(cookieStore.get('live')?.value || '')

  return (
    <html lang="en">
      <body>
        <Providers initialChainId={initialChainId?.value} initialLiveState={initialLiveState}>
          <Header />
          <main className="container pt-5 pb-10">
            {children}
            <Betslip />
          </main>
        </Providers>
      </body>
    </html>
  )
}
