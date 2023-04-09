import { endent } from '@dword-design/functions'
import { loadNuxt } from '@nuxt/kit'
import { execaCommand } from 'execa'
import { expect } from 'expect'
import { build } from 'nuxt'
import outputFiles from 'output-files'
import { pEvent } from 'p-event'
import kill from 'tree-kill-promise'
import withLocalTmpDir from 'with-local-tmp-dir'

export default (options = {}) => ({
  transform: config => {
    config = { nuxtConfig: {}, test: () => {}, ...config }

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

        const nuxt = await loadNuxt({
          config: {
            telemetry: false,
            vite: { logLevel: 'error' },
            ...config.nuxtConfig,
          },
        })
        if (config.error) {
          await expect(build(nuxt)).rejects.toThrow(config.error)
        } else {
          await build(nuxt)

          const childProcess = execaCommand('nuxt start', { all: true })
          await pEvent(
            childProcess.all,
            'data',
            data => data.toString() === 'Listening http://[::]:3000\n',
          )
          try {
            await config.test.call(this)
          } finally {
            await kill(childProcess.pid)
          }
        }
      })
    }
  },
})
