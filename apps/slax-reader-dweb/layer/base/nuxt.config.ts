import { getDWebConfig, getEnv } from '../../../../configs/env'
import replace from '@rollup/plugin-replace'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const env = getEnv()
const isDev = env === 'development'
const isPreview = env === 'preview'
console.log('Current env is:', env)

console.log('path: #', join(currentDir, './assets/images'))
const envConfig = getDWebConfig()

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  $meta: {
    name: 'base'
  },
  alias: {
    '@images': join(currentDir, './assets/images')
  },
  components: {
    dirs: [
      {
        path: join(currentDir, './components/global'),
        global: true
      }
    ]
  },
  css: [join(currentDir, './styles/global.scss')],
  modules: ['@nuxtjs/i18n'],
  i18n: {
    strategy: 'no_prefix',
    locales: [
      { code: 'zh', iso: 'zh-CN', file: 'zh.json' },
      { code: 'en', iso: 'en-US', file: 'en.json' }
    ],
    lazy: true,
    defaultLocale: 'en'
  }
})
