import typescript from '@rollup/plugin-typescript'
// https://www.misha.wtf/blog/rollup-server-components
import preserverDirectives from 'rollup-plugin-preserve-directives'

/**
 * @type {import('rollup').RollupOptions}
 */
export default [
  {
    input: {
      index: 'src/index.ts',
      config: 'src/config.ts',
      apollo: 'src/react/apollo.tsx',
    },
    output: {
      dir: 'dist',
      entryFileNames: (chunkInfo) => {
        if (chunkInfo.name === 'apollo') {
          return 'react/[name].js'
        }

        return '[name].js'
      },
      format: 'es',
    },
    external: [
      /@apollo/,
      /graphql/,
      /react/,
      /viem/,
      /wagmi/,
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
      }),
    ],
  },
  {
    input: 'src/nextjs/apollo.tsx',
    output: {
      dir: 'dist',
      entryFileNames: '[name].js',
      format: 'es',
      preserveModules: true,
    },
    external: [
      /@apollo/,
      /react/,
      /viem/,
    ],
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
      }),
      preserverDirectives(),
    ],
    onwarn: (warning, warn) => {
      if (warning.code !== 'MODULE_LEVEL_DIRECTIVE') {
        warn(warning)
      }
    },
  },
]
