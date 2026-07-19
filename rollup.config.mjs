import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import babel from '@rollup/plugin-babel'
import vue from 'rollup-plugin-vue'
import postcss from 'rollup-plugin-postcss'
import autoprefixer from 'autoprefixer'
import cssnano from 'cssnano'

const isProd = process.env.NODE_ENV === 'production'

export default {
  input: 'packages/dynamic-table/index.js',
  output: [
    {
      file: 'lib/dynamic-table.esm.js',
      format: 'esm',
      sourcemap: false
    },
    {
      file: 'lib/dynamic-table.umd.js',
      format: 'umd',
      name: 'DynamicTable',
      sourcemap: false,
      globals: {
        vue: 'Vue',
        'element-ui': 'ELEMENT',
        vuedraggable: 'vuedraggable'
      }
    }
  ],
  external: ['vue', 'element-ui', 'vuedraggable', 'sortablejs'],
  plugins: [
    resolve({
      extensions: ['.js', '.vue']
    }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [
        ['@babel/preset-env', {
          modules: false,
          targets: 'ie >= 9, chrome >= 49, firefox >= 52, safari >= 10, node >= 6'
        }]
      ]
    }),
    vue({
      css: false,
      compileTemplate: true
    }),
    postcss({
      plugins: [autoprefixer, ...(isProd ? [cssnano] : [])],
      extract: 'dynamic-table.css',
      minimize: isProd
    })
  ]
}