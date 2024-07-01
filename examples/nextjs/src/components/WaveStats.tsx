'use client'

import React, { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useWaveLevels, useWaveStats, useWaveActivation } from '@azuro-org/sdk';
import cx from 'clsx'


export function WaveStats() {
  const { address } = useAccount()
  const { data: stats } = useWaveStats({ account: address! })
  const { activate, isPending: isActivating } = useWaveActivation({ account: address! })
  const { data: levels } = useWaveLevels()

  const nextLevelData = useMemo(() => {
    if (!levels || !stats) {
      return undefined
    }

    const nextLevel = stats.level + 1

    return levels[nextLevel]
  }, [ levels, stats ])

  if (!stats || !address) {
    return null
  }

  const rootClassName = cx(
    'p-1 border border-solid border-bg-30 rounded-md w-fit bg-slate-200',
    'text-label-16 font-semibold text-grey-90'
  )
  const cardBaseClassName = 'relative py-2.5 px-3.5 min-w-36 bg-white rounded'

  return (
    <div className={rootClassName}>
      <div className={cx('grid gap-0.5', stats?.isActivated ? 'grid-cols-3' : 'grid-cols-2')}>
        <div className={cx(cardBaseClassName, 'rounded-l-3')}>
          {
            stats?.isActivated ? (
              <>
                <p className="text-slate-300">Status</p>
                <p>{stats.levelDescription.name}</p>
              </>
            ) : (
              <div className="size-full flex items-center">
                <button
                  className="w-full bg-slate-200 rounded-xl"
                  onClick={() => activate()}
                >
                  {isActivating ? 'loading...' : 'Enhance'}
                </button>
              </div>
            )
          }
        </div>
        {
          stats?.isActivated && (
            <div className={cardBaseClassName}>
                <p className="text-slate-300">Progress</p>
              <div className="flex items-center justify-start">
                <span className="font-semibold">
                  {stats?.points}
                </span>
                {
                  Boolean(nextLevelData?.pointsNeeded) && (
                    <>
                      <span className="mx-2">/</span>
                      <span className="text-label-16 font-semibold">{nextLevelData!.pointsNeeded}</span>
                    </>
                  )
                }
              </div>
            </div>
          )
        }
        <div className={cx(cardBaseClassName, 'rounded-r-3')}>
          <p className="text-slate-300">Wave Points</p>
          <p>{stats?.multipliedPoints || 0}</p>
        </div>
      </div>
    </div>
  )
}
