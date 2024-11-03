'use client'

import React, { useMemo, useState } from 'react';
import { useWaveLeaderBoard, useWavePeriods, WavePeriod } from '@azuro-org/sdk';
import { useAccount } from 'wagmi';
import cx from 'clsx'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

type Tabs = Array<{
  title: string
} & WavePeriod>

export function WaveLeaderBoard() {
  const { address } = useAccount()
  const [ activeTabIndex, setActiveTabIndex ] = useState(0)

  const { data: periods, isFetching: isPeriodsFetching } = useWavePeriods()

  const tabs = useMemo<Tabs>(() => {
    if (!periods) {
      return []
    }

    return periods.reduce((acc, period) => {
      acc.push({
        ...period,
        title: `${dayjs.utc(period.startsAt * 1000).format('MMM DD')} - ${dayjs.utc(period.endsAt * 1000).format('MMM DD')}`,
      })

      return acc
    }, [{
      id: 0,
      title: 'Total',
      startsAt: 0,
      endsAt: 0,
      isBonusPreCalc: false,
    }] as Tabs)
  }, [ periods ])

  const activeTab = tabs?.[activeTabIndex]

  const { data: leaderBoard, isFetching: isLeaderBoardFetching } = useWaveLeaderBoard({
    account: address,
    startsAt: activeTab?.startsAt,
    enabled: Boolean(activeTab),
  })

  if (isPeriodsFetching) {
    return 'Loading...'
  }

  if (!leaderBoard) {
    return null
  }

  const columnClassName = 'grid grid-cols-[40px_1fr_200px_200px] p-2'

  return (
    <div className='mt-2'>
      <div className="flex items-center space-x-1">
        {
          tabs.map(({ title }, index) => (
            <div key={title}
              className={cx("p-1 bg-slate-200 cursor-pointer rounded-md", {'bg-slate-300': index === activeTabIndex})}
              onClick={() => setActiveTabIndex(index)}
            >
              {title}
            </div>
          ))
        }
      </div>
      <div className="">
        {
          isLeaderBoardFetching ? (
            'Loading...'
          ) : (
            <>
              <div className={columnClassName}>
                <div className="">#</div>
                <div className="">Wallet Address</div>
                <div className="">
                  {activeTab?.title === 'Total' ? 'Status' : 'Wave Points'}
                </div>
                <div className="">
                  {activeTab?.title === 'Total' ? 'Wave Points' : 'Bonus Points'}
                </div>
              </div>
              {
                leaderBoard?.map(({ position, address: walletAddress, points, levelDescription, totalMultipliedPoints }, index) => {
                  return (
                    <div key={walletAddress} className={cx(columnClassName, {
                      'bg-slate-200': index % 2,
                      'bg-sky-200': walletAddress.toLowerCase() === address?.toLowerCase()
                    })}>
                      <div className="">{position}</div>
                      <div className="">{walletAddress}</div>
                      <div className="">
                        {
                          activeTab?.title === 'Total' ? levelDescription?.name : points
                        }
                      </div>
                      <div className="">
                        {
                          activeTab?.title === 'Total' ? totalMultipliedPoints : (Number(totalMultipliedPoints) - Number(points))
                        }
                      </div>
                    </div>
                  )
                })
              }
            </>
          )
        }
      </div>
    </div>
  );
}
