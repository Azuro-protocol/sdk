import { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: 'https://thegraph.azuro.org/subgraphs/name/azuro-protocol/azuro-api-polygon-v2',
  documents: [
    'src/docs/**/*.graphql',
  ],
  generates: {
    'src/types.ts': { plugins: ['typescript'] },
    'src/': {
      preset: 'near-operation-file',
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
      },
    },
  },
  // generates: {
  //   './src/gql/': {
  //     preset: 'client',
  //   },
  // },
  ignoreNoDocuments: true, // for better experience with the watcher
}

export default config
