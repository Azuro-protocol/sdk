import typescript from '@rollup/plugin-typescript'
// https://www.misha.wtf/blog/rollup-server-components
import preserverDirectives from 'rollup-plugin-preserve-directives'

/**
 * @type {import('rollup').RollupOptions}
 */
export default {
  input: [
    'src/index.ts',
    'src/react/apollo.tsx',
    'src/nextjs/apollo.tsx',
  ],
  output: {
    dir: 'dist',
    entryFileNames: '[name].js',
    format: 'es',
    preserveModules: true,
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
    preserverDirectives(),
  ],
  onwarn: (warning, warn) => {
    if (warning.code !== 'MODULE_LEVEL_DIRECTIVE') {
      warn(warning)
    }
  },
}
