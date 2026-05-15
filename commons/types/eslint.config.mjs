import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettierRecommend from 'eslint-plugin-prettier/recommended'
import prettierConfig from 'eslint-config-prettier'

export default [
  { ignores: ['eslint.config.mjs'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  prettierRecommend,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-empty-object-type': 'off'
    }
  }
]
