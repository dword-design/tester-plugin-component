import { endent } from '@dword-design/functions'
import packageName from 'depcheck-package-name'
import execa from 'execa'
import outputFiles from 'output-files'
import unifyMochaOutput from 'unify-mocha-output'
import withLocalTmpDir from 'with-local-tmp-dir'

export default {
  'client mode': function () {
    return withLocalTmpDir(async () => {
      await outputFiles({
        'index.spec.js': endent`
        import { endent } from '@dword-design/functions'
        import tester from '${packageName`@dword-design/tester`}'
        import self from '../src'
        import testerPluginPuppeteer from '${packageName`@dword-design/tester-plugin-puppeteer`}'

        export default tester({
          works: {
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
          self({ pluginMode: 'client', componentPath: require.resolve('./index.vue') }),
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

      const output = await execa(
        'nyc',
        [
          '--reporter',
          'lcov',
          '--reporter',
          'text',
          '--cwd',
          process.cwd(),
          '--extension',
          '.vue',
          '--exclude',
          'tmp-*',
          'mocha',
          '--ui',
          packageName`mocha-ui-exports-auto-describe`,
          '--timeout',
          80000,
          'index.spec.js',
        ],
        { all: true }
      )
      expect(output.all |> unifyMochaOutput).toMatchSnapshot(this)
    })
  },
  'nuxt config': () =>
    withLocalTmpDir(async () => {
      await outputFiles({
        'index.spec.js': endent`
        import { endent } from '@dword-design/functions'
        import tester from '${packageName`@dword-design/tester`}'
        import self from '../src'
        import globby from '${packageName`globby`}'

        export default tester({
          works: {
            files: {
              'node_modules/foobar.js': "export default () => console.log('foobarbaz')",
            },
            nuxtConfig: { build: { quiet: false }, modules: ['foobar'] },
            page: endent\`
              <template>
                <self class="foo" />
              </template>

            \`,
            test: () => {},
          },
        }, [
          self({ componentPath: require.resolve('./index.vue') }),
        ])

      `,
        'index.vue': endent`
        <template>
          <div>Hello world</div>
        </template>

      `,
      })

      const output = await execa(
        'nyc',
        [
          '--cwd',
          process.cwd(),
          '--extension',
          '.vue',
          '--exclude',
          'tmp-*',
          'mocha',
          '--ui',
          packageName`mocha-ui-exports-auto-describe`,
          '--timeout',
          80000,
          'index.spec.js',
        ],
        { all: true }
      )
      expect(output.all |> unifyMochaOutput).toMatch('foobarbaz')
    }),
  works() {
    return withLocalTmpDir(async () => {
      await outputFiles({
        'index.spec.js': endent`
        import { endent } from '@dword-design/functions'
        import tester from '${packageName`@dword-design/tester`}'
        import self from '../src'
        import testerPluginPuppeteer from '${packageName`@dword-design/tester-plugin-puppeteer`}'
        import globby from '${packageName`globby`}'

        export default tester({
          works: {
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
          self({ componentPath: require.resolve('./index.vue') }),
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

      const output = await execa(
        'nyc',
        [
          '--reporter',
          'lcov',
          '--reporter',
          'text',
          '--cwd',
          process.cwd(),
          '--extension',
          '.vue',
          '--exclude',
          'tmp-*',
          'mocha',
          '--ui',
          packageName`mocha-ui-exports-auto-describe`,
          '--timeout',
          80000,
          'index.spec.js',
        ],
        { all: true }
      )
      expect(output.all |> unifyMochaOutput).toMatchSnapshot(this)
    })
  },
}
