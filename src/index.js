import { endent } from '@dword-design/functions'
import { execaCommand } from 'execa'
import nuxtDevReady from 'nuxt-dev-ready'
import outputFiles from 'output-files'
import kill from 'tree-kill-promise'
import withLocalTmpDir from 'with-local-tmp-dir'

export default (options = {}) => ({
  transform: config => {
    config = { test: () => {}, ...config }

    return function () {
      return withLocalTmpDir(async () => {
        await outputFiles({
          'pages/index.vue': config.page,
          [`plugins/plugin${
            options.pluginMode ? `.${options.pluginMode}` : ''
          }.js`]: endent`
            import Self from '${options.componentPath.replace(/\\/g, '/')}'

            export default defineNuxtPlugin(nuxtApp => nuxtApp.vueApp.component('Self', Self))
          `,
          ...config.files,
        })

        const childProcess = execaCommand('nuxt dev', {
          env: { NUXT_TELEMETRY_DISABLED: 1 },
        })
        await nuxtDevReady()
        try {
          await config.test.call(this)
        } finally {
          await kill(childProcess.pid)
        }
      })
    }
  },
})
