import { endent } from '@dword-design/functions'
import packageName from 'depcheck-package-name'
import execa from 'execa'
import outputFiles from 'output-files'
import withLocalTmpDir from 'with-local-tmp-dir'

export default {
  works: () =>
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
                <self class="foo" />
              </template>

            \`,
            async test() {
              await this.page.goto('http://localhost:3000')
              const foo = await this.page.waitForSelector('.foo')
              expect(await foo.evaluate(el => el.innerText)).toEqual('Hello world')
            },
          },
        }, [self(), testerPluginPuppeteer()])

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
