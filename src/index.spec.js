import { endent } from '@dword-design/functions'
import packageName from 'depcheck-package-name'
import execa from 'execa'
import outputFiles from 'output-files'
import withLocalTmpDir from 'with-local-tmp-dir'

export default {
  'client mode': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'index.spec.js': endent`
        import { endent } from '@dword-design/functions'
        import tester from '${packageName`@dword-design/tester`}'
        import self from '../src'
        import testerPluginPuppeteer from '${packageName`@dword-design/tester-plugin-puppeteer`}'

        export default tester({
          works: {
            componentPath: require.resolve('./index.vue'),
            page: endent\`
              <template>
                <client-only>
                  <self class="foo" />
                </client-only>
              </template>

            \`,
            async test() {
              await this.page.goto('http://localhost:3000')
              const foo = await this.page.waitForSelector('.foo')
              expect(await foo.evaluate(el => el.innerText)).toEqual('Hello world')
            },
          },
        }, [
          self({ pluginMode: 'client' }),
          testerPluginPuppeteer(),
        ])

      `,
        'index.vue': endent`
        <template>
          <div>{{ value }}</div>
        </template>

        <script>
        export default {
          computed: {
            value: () => {
              window.foo = 'Hello world'
              return window.foo
            }
          }
        }
        </script>

      `,
      })
      await execa.command(
        `mocha --ui ${packageName`mocha-ui-exports-auto-describe`} --timeout 80000 index.spec.js`
      )
    }),
  works: () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'index.spec.js': endent`
        import { endent } from '@dword-design/functions'
        import tester from '${packageName`@dword-design/tester`}'
        import self from '../src'
        import testerPluginPuppeteer from '${packageName`@dword-design/tester-plugin-puppeteer`}'
        import globby from '${packageName`globby`}'

        export default tester({
          works: {
            componentPath: require.resolve('./index.vue'),
            page: endent\`
              <template>
                <self class="foo" />
              </template>

            \`,
            async test() {
              await this.page.goto('http://localhost:3000')
              const foo = await this.page.waitForSelector('.foo')
              expect(await foo.evaluate(el => el.innerText)).toEqual('Hello world')
            },
          },
        }, [
          self(),
          testerPluginPuppeteer(),
          {
            after: async () =>
              expect(await globby('*', { onlyFiles: false })).toEqual(['index.spec.js', 'index.vue']),
          },
        ])

      `,
        'index.vue': endent`
        <template>
          <div>Hello world</div>
        </template>

      `,
      })
      await execa.command(
        `mocha --ui ${packageName`mocha-ui-exports-auto-describe`} --timeout 80000 index.spec.js`
      )
    }),
}
