'use client'
import { useBetsSummary, useChain } from "@azuro-org/sdk"
import { useAccount } from "wagmi"

export function BetsSummary() {
  const { address } = useAccount()
  const { betToken } = useChain()
  const { toPayout, inBets, totalPayout, totalProfit, betsCount, wonBetsCount, lostBetsCount, loading } = useBetsSummary({
    account: address!,
  })

  if (!address || loading) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 w-full max-w-72 bg-zinc-100 p-4 rounded-md border border-solid">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">To Payout:</span> 
        {toPayout} {betToken.symbol}
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">In Bets:</span> 
        {inBets} {betToken.symbol}
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">Total Payout:</span> 
        {totalPayout} {betToken.symbol}
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">Total Profit:</span> 
        {totalProfit} {betToken.symbol}
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">Bets Count:</span> 
        {betsCount}
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">Won Bets:</span> 
        {wonBetsCount}
      </div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">Lost Bets:</span> 
        {lostBetsCount}
      </div>
    </div>
  )
}
