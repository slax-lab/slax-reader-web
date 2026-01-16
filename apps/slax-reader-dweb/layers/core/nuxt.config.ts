import pkg from './../../package.json'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const currentDir = dirname(fileURLToPath(import.meta.url))

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  $meta: {
    name: 'core'
  },

  app: {
    head: {
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
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
    '@': fileURLToPath(new URL('./', import.meta.url)),
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
  runtimeConfig: {
    public: {
      appVersion: pkg.version
    }
  },
  css: [join(currentDir, './styles/global.scss')],
  modules: ['@pinia/nuxt', 'pinia-plugin-persistedstate/nuxt', '@nuxtjs/i18n', '@vueuse/nuxt', '@unocss/nuxt', '@nuxt/content'],
  i18n: {
    strategy: 'no_prefix',
    locales: [
      { code: 'zh', iso: 'zh-CN', file: 'zh.json' },
      { code: 'en', iso: 'en-US', file: 'en.json' }
    ],
    defaultLocale: 'en'
  }
})
