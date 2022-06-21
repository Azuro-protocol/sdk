const { configure, setSelectedChainId, fetchGames } = require('../lib')
const { setTokenDecimals } = require("../src");


configure({
  rpcUrl: 'https://sokol-rpc.azuro.org',
  ipfsGateway: 'https://azuro.mypinata.cloud/ipfs/',
})

setTokenDecimals(18)
setSelectedChainId(4)

fetchGames()
  .then((res) => {
    console.log('result:', res)
  })
  .catch((err) => {
    console.error('error:', err)
  })
