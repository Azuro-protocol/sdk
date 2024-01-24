import typescript from '@rollup/plugin-typescript'
// // https://www.misha.wtf/blog/rollup-server-components
// import preserverDirectives from 'rollup-plugin-preserve-directives'

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
    /axios/,
    /cookies-next/,
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
    }),
    // preserverDirectives(),
  ],
  onwarn: (warning, warn) => {
    if (warning.code !== 'MODULE_LEVEL_DIRECTIVE') {
      warn(warning)
    }
  },
}
