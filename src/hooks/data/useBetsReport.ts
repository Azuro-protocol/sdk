import { useQuery, queryOptions, type UseQueryResult } from '@tanstack/react-query'
import {
  type BetsFilter,
  type ChainId,
  type GetBetsReportResult,
  getBetsReport,
  normalizeBetsFilter,
} from '@azuro-org/toolkit'

import { useOptionalChain } from '../../contexts/chain'
import { type QueryParameterWithSelect } from '../../global'
import { betsQueryKeys } from '../../helpers/betsQueryKeys'


export type UseBetsReportQueryFnData = GetBetsReportResult

export type UseBetsReportProps<TData = UseBetsReportQueryFnData> = {
  filter: BetsFilter
  chainId?: ChainId
  query?: QueryParameterWithSelect<UseBetsReportQueryFnData, TData>
}

export type GetUseBetsReportQueryOptionsProps<TData = UseBetsReportQueryFnData> = UseBetsReportProps<TData> & {
  chainId: ChainId
}

export type UseBetsReport = <TData = UseBetsReportQueryFnData>(
  props: UseBetsReportProps<TData>
) => UseQueryResult<TData>

export const getUseBetsReportQueryOptions = <TData = UseBetsReportQueryFnData>(
  params: GetUseBetsReportQueryOptionsProps<TData>
) => {
  const { filter, chainId, query = {} } = params

  const normalizedFilter = normalizeBetsFilter(filter)

  return queryOptions({
    queryKey: betsQueryKeys.report({ chainId, filter: normalizedFilter }),
    // `signal` is threaded through on purpose: the report walks the bets page by page, so changing
    // a filter mid-walk must abort the remaining requests instead of racing the new report
    queryFn: async ({ signal }): Promise<UseBetsReportQueryFnData> => {
      return getBetsReport({
        chainId,
        filter,
        signal,
      })
    },
    // a report over the whole history is expensive and does not move on its own
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    // reporting on every bettor at once is never what the caller meant, and the fetcher refuses it,
    // so stay idle until there is an address to report on
    enabled: Boolean(filter.bettor),
    ...query,
  })
}

/**
 * Aggregates every bet matching a filter into a turnover / returns / profit / ROI report.
 *
 * The report is exact over all matching bets, not only over the pages a list has loaded, and its
 * filter is turned into a subgraph query by the same code `useBets` uses, so the report always
 * describes exactly the bets the list shows.
 *
 * Pending bets are excluded from the ROI figures and surfaced separately as `atStake`.
 * Freebet-funded bets are excluded from every main figure and reported on their own line.
 * Check `isTruncated`: when it is `true` the figures are a lower bound and the UI must say so.
 *
 * - Docs: https://gem.azuro.org/hub/apps/sdk/data-hooks/useBetsReport
 *
 * @example
 * import { BetStatusFilter } from '@azuro-org/sdk'
 * import { useBetsReport } from '@azuro-org/sdk'
 *
 * const { data: report, isFetching } = useBetsReport({
 *   filter: { bettor: '0x...', status: BetStatusFilter.Settled },
 * })
 *
 * const row = report?.single ?? report?.byToken[0]
 * */
export const useBetsReport: UseBetsReport = <TData = UseBetsReportQueryFnData>(
  props: UseBetsReportProps<TData>
): UseQueryResult<TData> => {
  const { chain } = useOptionalChain(props.chainId)

  return useQuery(getUseBetsReportQueryOptions({ ...props, chainId: chain.id }))
}
