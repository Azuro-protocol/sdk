'use client'
import { useOddsWatcher, useConditionStatusWatcher } from '@azuro-org/sdk'

export function Watchers() {
  useOddsWatcher()
  useConditionStatusWatcher()

  return null
}
