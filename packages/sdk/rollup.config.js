import typescript from '@rollup/plugin-typescript'

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: [
    'src/index.ts',
  ],
  output: {
    dir: 'dist',
    entryFileNames: '[name].js',
    format: 'es',
  },
  external: [
    'wagmi',
    'viem',
    'viem/chains',
  ],
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
    }),
  ],
}
