import { endent } from '@dword-design/functions'
import tester from '@dword-design/tester'
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir'
import packageName from 'depcheck-package-name'
import { execa } from 'execa'
import outputFiles from 'output-files'
import unifyMochaOutput from 'unify-mocha-output'

export default tester(
  {
    async 'client mode'() {
      await outputFiles({
        'index.spec.js': endent`
      import { endent } from '@dword-design/functions'
      import tester from '${packageName`@dword-design/tester`}'
      import testerPluginPuppeteer from '${packageName`@dword-design/tester-plugin-puppeteer`}'
      import { expect } from 'expect'
      import { createRequire } from 'module'

      import self from '../src/index.js'

      const _require = createRequire(import.meta.url)

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
        self({ pluginMode: 'client', componentPath: _require.resolve('./index.vue') }),
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
        'package.json': JSON.stringify({ type: 'module' }),
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
    },
    error: async () => {
      await outputFiles({
        'index.spec.js': endent`
    import tester from '${packageName`@dword-design/tester`}'
    import { createRequire } from 'module'

    import self from '../src/index.js'

    const _require = createRequire(import.meta.url)

    export default tester({
      works: {
        test: () => {
          throw new Error('Foo bar baz')
        },
      },
    }, [
      self({ componentPath: _require.resolve('./index.vue') }),
    ])

  `,
        'index.vue': endent`
    <template>
      <div>Hello world</div>
    </template>

  `,
        'package.json': JSON.stringify({ type: 'module' }),
      })
      await expect(
        execa(
          'mocha',
          [
            '--ui',
            packageName`mocha-ui-exports-auto-describe`,
            '--timeout',
            80000,
            'index.spec.js',
          ],
          { all: true }
        )
      ).rejects.toThrow('Foo bar baz')
    },
    'nuxt config': async () => {
      await outputFiles({
        'index.spec.js': endent`
      import { endent } from '@dword-design/functions'
      import tester from '${packageName`@dword-design/tester`}'
      import { globby } from '${packageName`globby`}'
      import { createRequire } from 'module'

      import self from '../src/index.js'

      const _require = createRequire(import.meta.url)

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
        self({ componentPath: _require.resolve('./index.vue') }),
      ])

    `,
        'index.vue': endent`
      <template>
        <div>Hello world</div>
      </template>

    `,
        'package.json': JSON.stringify({ type: 'module' }),
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
    },
    async works() {
      await outputFiles({
        'index.spec.js': endent`
      import { endent } from '@dword-design/functions'
      import tester from '${packageName`@dword-design/tester`}'
      import self from '../src/index.js'
      import testerPluginPuppeteer from '${packageName`@dword-design/tester-plugin-puppeteer`}'
      import { globby } from '${packageName`globby`}'
      import { createRequire } from 'module'
      import { expect } from 'expect'

      const _require = createRequire(import.meta.url)

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
        self({ componentPath: _require.resolve('./index.vue') }),
        testerPluginPuppeteer(),
        {
          after: async () =>
            expect(new Set(await globby('*', { onlyFiles: false }))).toEqual(new Set(['index.spec.js', 'index.vue', 'node_modules', 'package.json'])),
        },
      ])

    `,
        'index.vue': endent`
      <template>
        <div>Hello world</div>
      </template>

    `,
        'package.json': JSON.stringify({ type: 'module' }),
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
    },
  },
  [testerPluginTmpDir()]
)
