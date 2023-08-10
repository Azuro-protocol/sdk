'use client'
import { useGames } from '@azuro-org/sdk'
import { GameCard } from '@/components'

export default function Home() {
  const { loading, data } = useGames()

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <main className="container pt-5 pb-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {
          data?.games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))
        }
      </div>
    </main>
  )
}
