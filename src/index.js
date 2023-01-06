import { endent } from '@dword-design/functions'
import testerPluginNuxtConfig from '@dword-design/tester-plugin-nuxt-config'
import packageName from 'depcheck-package-name'
import P from 'path'

export default (options = {}) => {
  const testerPlugin = testerPluginNuxtConfig()

  return {
    ...testerPlugin,
    transform: config => {
      config = { nuxtConfig: {}, vueVersion: 2, ...config }

      return testerPlugin.transform({
        config: {
          dev: true,
          ...config.nuxtConfig,
          modules: [
            ...(config.vueVersion === 2
              ? [packageName`nuxt-sourcemaps-abs-sourceroot`]
              : []),
            ...(config.nuxtConfig.modules || []),
          ],
          plugins: [
            {
              mode: options.pluginMode,
              src: P.join('plugins', 'plugin.js'),
            },
            ...(config.nuxtConfig.plugins || []),
          ],
        },
        error: config.error,
        files: {
          'pages/index.vue': config.page,
          'plugins/plugin.js': endent`
            import Self from '${options.componentPath.replace(/\\/g, '/')}'

            ${
              config.vueVersion === 3
                ? "export default defineNuxtPlugin(nuxtApp => nuxtApp.vueApp.component('Self', Self))"
                : endent`
                import Vue from '${packageName`vue`}'
      
                Vue.component('Self', Self)
              `
            }
          `,
          ...config.files,
        },
        nuxtVersion: config.vueVersion,
        test: config.test,
      })
    },
  }
}
