import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const currentDir = dirname(fileURLToPath(import.meta.url))

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  $meta: {
    name: 'base'
  },

  app: {
    head: {
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1'
        },
        {
          charset: 'utf-8'
        }
      ],
      style: [],
      script: []
      // noscript: [{ children: 'JavaScript is required' }]
    },
    rootId: 'slax-reader-dweb',
    viewTransition: true,
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: { name: 'layout', mode: 'out-in' }
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
  modules: ['@pinia/nuxt', 'pinia-plugin-persistedstate/nuxt', '@nuxtjs/i18n', '@vueuse/nuxt', '@unocss/nuxt'],
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
