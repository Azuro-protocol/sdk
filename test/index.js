const { configure, setSelectedChainId, fetchGames, setRateDecimals } = require('../lib')
const { setTokenDecimals } = require("../src");


configure({
  rpcUrl: 'https://sokol-rpc.azuro.org',
  ipfsGateway: 'https://azuro.mypinata.cloud/ipfs/',
})

setRateDecimals(9)
setTokenDecimals(18)
setSelectedChainId(4)

fetchGames()
  .then((res) => {
    console.log('result:', res)
  })
  .catch((err) => {
    console.error('error:', err)
  })
