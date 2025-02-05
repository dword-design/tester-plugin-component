import { endent } from '@dword-design/functions';
import tester from '@dword-design/tester';
import testerPluginTmpDir from '@dword-design/tester-plugin-tmp-dir';
import packageName from 'depcheck-package-name';
import { execaCommand } from 'execa';
import outputFiles from 'output-files';

export default tester(
  {
    'client mode': async () => {
      await outputFiles({
        'index.spec.js': endent`
          import { endent } from '@dword-design/functions'
          import tester from '${packageName`@dword-design/tester`}'
          import testerPluginPuppeteer from '${packageName`@dword-design/tester-plugin-puppeteer`}'
          import expect from 'expect'
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
      });

      await execaCommand('mocha --ui exports --timeout 80000 index.spec.js');
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
      });

      await expect(
        execaCommand('mocha --ui exports --timeout 80000 index.spec.js'),
      ).rejects.toThrow('Foo bar baz');
    },
    hasFindPort: async () => {
      await outputFiles({
        'index.spec.js': endent`
          import { endent } from '@dword-design/functions'
          import tester from '${packageName`@dword-design/tester`}'
          import self from '../src/index.js'
          import testerPluginPuppeteer from '${packageName`@dword-design/tester-plugin-puppeteer`}'
          import { globby } from '${packageName`globby`}'
          import { createRequire } from 'module'
          import expect from 'expect'

          const _require = createRequire(import.meta.url)

          export default tester({
            works: {
              page: endent\`
                <template>
                  <self class="foo" />
                </template>

              \`,
              async test({ port }) {
                await this.page.goto(\`http://localhost:\${port}\`)
                const foo = await this.page.waitForSelector('.foo')
                expect(await foo.evaluate(el => el.innerText)).toEqual('Hello world')
              },
            },
          }, [
            self({ componentPath: _require.resolve('./index.vue'), hasFindPort: true }),
            testerPluginPuppeteer(),
          ])

        `,
        'index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>

        `,
        'package.json': JSON.stringify({ type: 'module' }),
      });

      await execaCommand('mocha --ui exports --timeout 80000 index.spec.js');
    },
    works: async () => {
      await outputFiles({
        'index.spec.js': endent`
          import { endent } from '@dword-design/functions'
          import tester from '${packageName`@dword-design/tester`}'
          import self from '../src/index.js'
          import testerPluginPuppeteer from '${packageName`@dword-design/tester-plugin-puppeteer`}'
          import { globby } from '${packageName`globby`}'
          import { createRequire } from 'module'
          import expect from 'expect'

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
          ])

        `,
        'index.vue': endent`
          <template>
            <div>Hello world</div>
          </template>

        `,
        'package.json': JSON.stringify({ type: 'module' }),
      });

      await execaCommand('mocha --ui exports --timeout 80000 index.spec.js');
    },
  },
  [testerPluginTmpDir()],
);
