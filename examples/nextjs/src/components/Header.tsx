import React from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { ActiveLink, SelectAppChain } from '@/components'


export function Header() {

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
      </div>
      <div className="ml-auto flex items-center">
        <SelectAppChain />
        <ConnectButton />
      </div>
    </header>
  )
}
