import { endent, replace } from '@dword-design/functions'
import packageName from 'depcheck-package-name'
import esm from 'esm'
import { Builder, Nuxt } from 'nuxt'
import outputFiles from 'output-files'
import P from 'path'
import withLocalTmpDir from 'with-local-tmp-dir'

export default (options = {}) => ({
  transform: test => {
    test = { nuxtConfig: {}, test: () => {}, ...test }
    return function () {
      return withLocalTmpDir(async () => {
        await outputFiles({
          'pages/index.vue': test.page,
          'plugins/plugin.js': endent`
          import Self from '${options.componentPath |> replace(/\\/g, '/')}'
          import Vue from '${packageName`vue`}'

          Vue.component('Self', Self)

        `,
          ...test.files,
        })
        const nuxt = new Nuxt({
          createRequire: () => esm(module),
          dev: true,
          ...test.nuxtConfig,
          modules: [
            packageName`nuxt-sourcemaps-abs-sourceroot`,
            ...(test.nuxtConfig.modules || []),
          ],
          plugins: [
            {
              mode: options.pluginMode,
              src: P.resolve('plugins', 'plugin.js'),
            },
            ...(test.nuxtConfig.plugins || []),
          ],
        })
        await new Builder(nuxt).build()
        await nuxt.listen()
        await test.test.call(this)
        await nuxt.close()
      })
    }
  },
})
