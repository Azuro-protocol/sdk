const { configure, setSelectedChainId, fetchGames } = require('../lib')

configure({
  rpcUrl: 'https://sokol-rpc.azuro.org',
  ipfsGateway: 'https://azuro.mypinata.cloud/ipfs/',
})

setSelectedChainId(4)

fetchGames()
  .then((res) => {
    console.log('result:', res)
  })
  .catch((err) => {
    console.error('error:', err)
  })
