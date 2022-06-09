type Config = {
  rpcUrl: string
  ipfsGateway: string
}

const config: Config = {
  rpcUrl: null,
  ipfsGateway: null,
}

export const configure = (_config: Config) => {
  Object.entries(_config).forEach(([ key, value ]) => {
    config[key] = value
  })
}

export default config
