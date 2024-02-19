'use client'
import React, { useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ActiveLink, SelectAppChain, LiveSwitcher } from '@/components'
import { reconnect } from '@wagmi/core'
import { useConfig } from 'wagmi'

export function Header() {
  const config = useConfig()

  useEffect(() => {
    ;(async () => {
      try {
        await reconnect(config)
      }
      catch {}
    })()
  }, [])

  return (
    <header className="flex items-center py-3.5 border-b border-zinc-200">
      <div className="text-xl font-semibold">Azuro Betting</div>
      <div className="flex ml-10">
        <ActiveLink
          className="text-zinc-500 hover:text-black transition"
          activeClassName="!text-black font-semibold !cursor-default"
          href="/events/top"
          regex="^\/events\/[^/]+?$"
        >
          Events
        </ActiveLink>
        <ActiveLink
          className="text-zinc-500 hover:text-black transition ml-4"
          activeClassName="!text-black font-semibold !cursor-default"
          href="/bets"
          regex="^\/bets"
        >
          Bets
        </ActiveLink>
      </div>
      <div className="ml-auto flex items-center">
        <LiveSwitcher />
        <SelectAppChain />
        <ConnectButton chainStatus="none" />
      </div>
    </header>
  )
}
