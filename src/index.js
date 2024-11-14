import { endent } from '@dword-design/functions';
import { execaCommand } from 'execa';
import getPort from 'get-port';
import nuxtDevReady from 'nuxt-dev-ready';
import outputFiles from 'output-files';
import kill from 'tree-kill-promise';
import withLocalTmpDir from 'with-local-tmp-dir';

export default (options = {}) => ({
  transform: config => {
    config = { test: () => {}, ...config };

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
        });

        const port = options.hasFindPort ? await getPort() : 3000;

        const nuxt = execaCommand('nuxt dev', {
          env: { NUXT_TELEMETRY_DISABLED: 1, PORT: port },
        });

        await nuxtDevReady(port);

        try {
          await config.test.call(this, { port });
        } finally {
          await kill(nuxt.pid);
        }
      });
    };
  },
});
