import { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  ignoreNoDocuments: true, // for better experience with the watcher
  generates: {
    'src/docs/prematch/types.ts': {
      schema: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-polygon-v3',
      plugins: [
        'typescript',
      ],
    },
    'src/docs/prematch': {
      preset: 'near-operation-file',
      schema: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-polygon-v3',
      documents: 'src/docs/prematch/**/*.graphql',
      presetConfig: {
        extension: '.ts',
        baseTypesPath: 'types.ts',
      },
      plugins: [
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        withHooks: false,
        scalars: {
          'BigInt': 'string',
          'BigDecimal': 'string',
        }
      },
    },
    'src/docs/live/types.ts': {
      schema: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-live-data-feed-dev',
      plugins: [
        'typescript',
      ],
    },
    'src/docs/live': {
      preset: 'near-operation-file',
      schema: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-live-data-feed-dev',
      documents: 'src/docs/live/**/*.graphql',
      presetConfig: {
        extension: '.ts',
        baseTypesPath: 'types.ts',
      },
      plugins: [
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        withHooks: false,
        scalars: {
          'BigInt': 'string',
          'BigDecimal': 'string',
        }
      },
    },
  },
}

export default config
