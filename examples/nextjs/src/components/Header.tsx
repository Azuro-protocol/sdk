'use client'
import React, { useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ActiveLink, SelectAppChain } from '@/components'
import { useConfig } from 'wagmi';

export function Header() {
  const config = useConfig()

  useEffect(() => {
    ;(async () => {
      try {
        await config.autoConnect()
      }
      catch {}
    })()
  }, [])

  return (
    <header className="container flex items-center py-3.5 border-b border-zinc-200">
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
        <SelectAppChain />
        <ConnectButton chainStatus="none" />
      </div>
    </header>
  )
}
