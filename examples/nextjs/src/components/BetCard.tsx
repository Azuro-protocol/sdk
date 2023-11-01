'use client'
import { type Bet, getBetStatus, getGameStatus, BetStatus, GameStatus, useChain, useRedeemBet, useBetsCache } from '@azuro-org/sdk'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useMemo } from 'react'
import cx from 'clsx'


const BetStatusText = {
  [BetStatus.Accepted]: 'Accepted',
  [BetStatus.Canceled]: 'Canceled',
  [BetStatus.Live]: 'Live',
  [BetStatus.Lost]: 'Lost',
  [BetStatus.PendingResolution]: 'Pending resolution',
  [BetStatus.Won]: 'Won',
}

const GameStatusText = {
  [GameStatus.Canceled]: 'Canceled',
  [GameStatus.Live]: 'Live',
  [GameStatus.Paused]: 'Paused',
  [GameStatus.PendingResolution]: 'Pending resolution',
  [GameStatus.Preparing]: 'Preparing',
  [GameStatus.Resolved]: 'Resolved',
}

type Props = {
  bet: Bet
}

export function BetCard(props: Props) {
  const { 
    tokenId, createdAt, status: graphBetStatus, amount, outcomes, 
    payout, possibleWin, coreAddress, freebetId, 
    isWin, isLose, isCanceled, isRedeemed 
  } = props.bet

  const { betToken } = useChain()
  const { submit, isPending, isProcessing } = useRedeemBet()
  const { updateBetCache } = useBetsCache()

  const betStatus = useMemo(() => {
    return getBetStatus({
      graphStatus: graphBetStatus,
      games: outcomes.map(({ game }) => game),
      win: isWin,
      lose: isLose,
    })
  }, [])

  const isDisabled = isPending || isProcessing

  let winAmount
  let buttonTitle

  if (isCanceled) {
    winAmount = '––'
    buttonTitle = 'Refund'
  }
  else {
    winAmount = `${isWin ? '+' : ''}${possibleWin} ${betToken.symbol}`
    buttonTitle = 'Redeem'
  }

  if (isPending) {
    buttonTitle = 'Waiting for approval'
  }
  else if (isProcessing) {
    buttonTitle = 'Processing...'
  }

  const handleRedeem = async () => {
    try {
      await submit({ tokenId, coreAddress })
      updateBetCache({
        coreAddress,
        tokenId,
      }, {
        isRedeemed: true,
        isRedeemable: false,
      })
    } catch {}
  }

  return (
    <div className="p-4 bg-zinc-50 mt-2 first-of-type:mt-0 rounded-lg">
      <div className="flex items-center justify-between">
        <p>{dayjs(+createdAt * 1000).format('DD.MM.YYYY, hh:mm A')}</p>
        <p>{BetStatusText[betStatus]}</p>
      </div>
      {
        outcomes.map((outcome) => {
          const { odds, name, game, selectionName, isWin, isLose, game: { status: gameStatus, gameId, participants, startsAt, sport: { slug: sportSlug } } } = outcome

          const { league: { name: leagueName, country: { name: countryName }} } = game

          const className = cx("mt-4 p-4 rounded-md", {
            'bg-zinc-200': !isWin && !isLose,
            'bg-green-100': isWin,
            'bg-red-100': isLose,
          })

          return (
            <div className={className}>
              <div className="flex items-center justify-between flex-wrap">
                <div className="flex items-center flex-wrap">
                  <p className='mr-4'>{dayjs(+startsAt * 1000).format('DD.MM.YYYY, hh:mm A')}</p>
                  <p>{`${countryName}: ${leagueName}`}</p>
                </div>
                <p>{GameStatusText[getGameStatus({ graphGameStatus: gameStatus, startsAt })]}</p>
              </div>
              <div className="flex items-center">
                <Link href={`/events/${sportSlug}/${gameId}`} className="flex items-center mr-4">
                    {
                      participants.map(({ image, name }) => (
                        <div key={name} className="flex items-center ml-2 first-of-type:ml-0">
                          <div className="flex items-center justify-center w-8 h-8 mr-2 border border-zinc-300 rounded-full">
                            Boolean(image) && (
                              <img className="w-4 h-4" src={image!} alt="" />
                            )
                          </div>
                          <span className="text-md">{name}</span>
                        </div>
                      ))
                    }
                  </Link>
              </div>
              <div className="grid md:grid-cols-3 md:gap-16">
                <div>
                  <p>Market</p>
                  <p>{ name }</p>
                </div>
                <div>
                  <p>Outcome</p>
                  <p>{ selectionName }</p>
                </div>
                <div className="min-w-40 pr-4">
                  <p>Odds</p>
                  <p>{odds}</p>
                </div>
              </div>
            </div>
          )
        })
      }
      <div className="flex items-center justify-between mt-2 flex-wrap">
        <div className='flex items-center'>
          <p>Bet Amount:</p>
          &nbsp;
          <p>{`${amount} ${betToken.symbol}`}</p>
        </div>
        <div className="flex items-center flex-wrap">
          <div className='flex items-center mr-4'>
            <p>{isWin ? 'Winning:' : 'Possible Win:'}</p>
            &nbsp;
            <p>{winAmount}</p>
          </div>
          {
            isRedeemed ? (
              <p>Redeemed</p>
            ) : (
              Boolean(payout || (isCanceled && !freebetId) || isRedeemed) && (
                <button
                  className={cx('md:w-[200px] py-3.5 text-white font-semibold text-center rounded-xl', {
                    'bg-blue-500 hover:bg-blue-600 transition shadow-md': !isDisabled,
                    'bg-zinc-300 cursor-not-allowed': isDisabled,
                  })}
                  disabled={isDisabled}
                  onClick={handleRedeem}
                >
                  {buttonTitle}
                </button>
              )
            )
          }
        </div>
      </div>
    </div>
  )
}
