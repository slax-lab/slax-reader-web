import type { ESLint, Linter } from 'eslint'
import config from '../../eslint.config'
import typescriptParser from '@typescript-eslint/parser'
import unocss from '@unocss/eslint-plugin'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

const dwebConfig: Linter.Config[] = [
  ...config,

  {
    ignores: ['node_modules/', 'build/', '.nuxt/', 'dist/', '.wrangler/', 'public/']
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      // @unocss/eslint-plugin 的 configs 类型不满足 ESLint Plugin 的索引签名（上游类型定义问题），断言收口
      '@unocss': unocss as unknown as ESLint.Plugin
    },
    rules: {
      '@unocss/order': 'warn',
      '@unocss/order-attributify': 'warn',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            [`^vue$`, `^vue-router$`, `^ant-design-vue$`, `^echarts$`],
            [`.*\\.vue$`],
            [`.*/assets/.*`, `^@/assets$`],
            [`.*/config/.*`, `^@/config$`],
            [`.*/hooks/.*`, `^@/hooks$`],
            [`.*/plugins/.*`, `^@/plugins$`],
            [`.*/router/.*`, `^@/router$`],
            [`^@/services$`, `^@/services/.*`],
            [`.*/store/.*`, `^@/store$`],
            [`.*/utils/.*`, `^@/utils$`],
            [`^`],
            [`^type `]
          ]
        }
      ],
      'simple-import-sort/exports': 'error'
    }
  }
]

export default dwebConfig
