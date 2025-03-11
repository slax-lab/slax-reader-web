import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-plugin-prettier/recommended'
import prettierConfig from 'eslint-config-prettier'

export default [
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    plugins: {
      prettier: prettier
    },
    rules: {
      'prettier/prettier': [
        'error',
        {},
        {
          fileInfoOptions: {
            withNodeModules: true
          }
        }
      ]
    }
  }
]
