enum ChainId {
  Gnosis = 100,
  Polygon = 137,
  Arbitrum = 42161,
}

export const graphqlEndpoints: Record<number, string> = {
  [ChainId.Gnosis]: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-gnosis-v2',
  [ChainId.Polygon]: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-polygon-v2',
  [ChainId.Arbitrum]: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-arbitrum-v2',
}
