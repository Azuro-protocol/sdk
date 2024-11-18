import '@rainbow-me/rainbowkit/styles.css'
import './globals.css'
import { Providers, Header, Betslip, BetsSummary } from '@/components'
import { cookies } from 'next/headers'


export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const cookieStore = await cookies()

  const initialChainId = cookieStore.get('appChainId')?.value
  const initialLiveState = JSON.parse(cookieStore.get('live')?.value || 'false')

  return (
    <html lang="en">
      <body>
        <Providers initialChainId={initialChainId} initialLiveState={initialLiveState}>
          <div className="md:max-w-[1040px] mx-auto">
            <Header />
            <main className="pt-5 pb-10">
              <BetsSummary />
              {children}
              <Betslip />
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
