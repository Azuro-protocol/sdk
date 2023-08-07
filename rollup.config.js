import typescript from '@rollup/plugin-typescript'
// // https://www.misha.wtf/blog/rollup-server-components
// import preserverDirectives from 'rollup-plugin-preserve-directives'

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: {
    'index': 'src/index.ts',
    'nextjs/apollo': 'src/nextjs/apollo.tsx',
    'react/apollo': 'src/react/apollo.tsx',
  },
  output: {
    dir: 'dist',
    format: 'es',
    // preserveModules: true,
    manualChunks: {
      'config': [ 'src/config.ts' ],
      'chainContext': [ 'src/chainContext.tsx' ],
    },
    chunkFileNames: '[name].js',
    compact: true,
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
    // preserverDirectives(),
  ],
  onwarn: (warning, warn) => {
    if (warning.code !== 'MODULE_LEVEL_DIRECTIVE') {
      warn(warning)
    }
  },
}
