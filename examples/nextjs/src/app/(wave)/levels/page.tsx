'use client'
import { LevelsServer } from '@/components/test/LevelsServer';
import { useChain } from '@azuro-org/sdk';
import { Suspense } from 'react';


export default function Page() {
  const {appChain} = useChain()
  return (
    <Suspense fallback={<div>loading...</div>}>
      <LevelsServer chainId={appChain.id} />
    </Suspense>
  )
}
