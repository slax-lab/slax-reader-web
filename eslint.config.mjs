import tseslint from 'typescript-eslint'
import prettierRecommend from 'eslint-plugin-prettier/recommended'
import vueScopedCss from 'eslint-plugin-vue-scoped-css'
import vueParser from 'vue-eslint-parser'
import typescriptParser from '@typescript-eslint/parser'
import prettierConfig from 'eslint-config-prettier'
import vue from 'eslint-plugin-vue'

export default [
  {
    ignores: ['**/node_modules/**', '**/build/**', 'project-env.d.ts', '**/.wrangler/**', '**/.nuxt/**', '**/.wxt/**', '**/dist/**', '**/public/**']
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: typescriptParser,
        sourceType: 'module',
        ecmaVersion: 'latest'
      }
    },
    plugins: {
      'vue-scoped-css': vueScopedCss
    },
    rules: {
      ...vueScopedCss.configs['vue3-recommended'].rules
    }
  },
  ...vue.configs['flat/essential'],
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
  prettierRecommend,
  {
    rules: {
      camelcase: ['error', { properties: 'never' }],
      'prettier/prettier': [
        'error',
        {
          css: 'true',
          fileInfoOptions: {
            withNodeModules: true
          }
        }
      ],
      'vue/multi-word-component-names': 'off'
    }
  },
  prettierConfig
]
