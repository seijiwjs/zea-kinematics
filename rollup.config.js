import { terser } from 'rollup-plugin-terser'
import json from '@rollup/plugin-json'

import pkg from './package.json'

const external = ['@zeainc/zea-engine', '@zeainc/zea-ux']

const plugins = [json()]

const isProduction = !process.env.ROLLUP_WATCH

if (isProduction) {
  plugins.push(terser())
}

const sourcemap = true

export default [
  // Browser-friendly UMD build.
  {
    input: 'src/index.js',
    external,
    output: {
      name: 'zeaKinematics',
      file: pkg.umd,
      format: 'umd',
      sourcemap,
      globals: {
        '@zeainc/zea-engine': 'zeaEngine',
        '@zeainc/zea-ux': 'zeaUx',
      },
    },
    plugins,
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: 'src/index.js',
    external,
    output: [{ file: pkg.module, format: 'es', sourcemap }],
    plugins,
  },
]
