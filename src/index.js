import { endent, replace } from '@dword-design/functions'
import packageName from 'depcheck-package-name'
import { Builder, Nuxt } from 'nuxt'
import outputFiles from 'output-files'
import P from 'path'

export default () => ({
  transform: test =>
    async function () {
      test = { test: () => {}, ...test }
      await outputFiles({
        'pages/index.vue': test.page,
        'plugins/plugin.js': endent`
        import Self from '${test.componentPath |> replace(/\\/g, '/')}'
        import Vue from '${packageName`vue`}'

        Vue.component('Self', Self)

      `,
      })
      const nuxt = new Nuxt({
        createRequire: 'native',
        dev: false,
        plugins: [P.resolve('plugins', 'plugin.js')],
      })
      await new Builder(nuxt).build()
      await nuxt.listen()
      await test.test.call(this)
      await nuxt.close()
    },
})
