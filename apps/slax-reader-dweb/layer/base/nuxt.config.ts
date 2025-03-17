import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const currentDir = dirname(fileURLToPath(import.meta.url))
console.log('path: #', join(currentDir, './assets/images'))

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
  modules: ['@pinia/nuxt', 'pinia-plugin-persistedstate/nuxt', '@nuxtjs/i18n'],
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
