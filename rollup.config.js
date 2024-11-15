import typescript from '@rollup/plugin-typescript'

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: {
    'index': 'src/index.ts',
  },
  output: {
    dir: 'dist',
    format: 'es',
    manualChunks: {
      'config': [ 'src/config.ts' ],
    },
    chunkFileNames: '[name].js',
    compact: true,
  },
  external: [
    /@apollo/,
    /@azuro-org/,
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
  onwarn: (warning, warn) => {
    if (warning.code !== 'MODULE_LEVEL_DIRECTIVE') {
      warn(warning)
    }
  },
}
