# SDK


## Hooks

### useContracts
### useBetToken
### useCalcOdds
### useCalcOddsFunction


### usePlaceBet

Doesn't contain `minOdds` calculation because it's based on current odds values and slippage. We should be sure that 
odds values are updated, if usePlaceBet will contain the logic of calculation when there should be not necessary call for 
odds values fetching. This should be done only in client app, not in lib itself.


### oddsWatcher

Don't forget to resubscribe within Network change.

https://viem.sh/docs/actions/public/watchEvent.html#batch-optional
