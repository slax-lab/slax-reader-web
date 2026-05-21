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
    '@images': join(currentDir, './app/assets/images')
  },
  components: {
    dirs: [
      {
        path: join(currentDir, './app/components/global'),
        global: true
      }
    ]
  },
  css: [join(currentDir, './styles/theme.css'), join(currentDir, './styles/global.scss')],
  modules: ['@pinia/nuxt', 'pinia-plugin-persistedstate/nuxt', '@nuxtjs/i18n', '@vueuse/nuxt', '@unocss/nuxt', '@nuxt/content', '@nuxtjs/color-mode'],
  // 主题状态由 @nuxtjs/color-mode 管理，双输出 `<html class="dark" data-slax-theme="dark">`
  //   - classSuffix: '' 让生成的类名为 'dark' / 'light' / 'eink'，兼容现有 dark:'class' 与既有 dark: 类
  //   - dataValue: 'slax-theme' 让 data 属性名是 data-slax-theme，避开 daisyUI / Tailwind dark mode 等公网 data-theme 命名空间冲突
  //   - storageKey: 'slax-color-mode' 使用项目私有 localStorage key
  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
    dataValue: 'slax-theme',
    storageKey: 'slax-color-mode'
  },
  i18n: {
    strategy: 'no_prefix',
    locales: [
      { code: 'zh', iso: 'zh-CN', file: 'zh.json' },
      { code: 'en', iso: 'en-US', file: 'en.json' }
    ],
    defaultLocale: 'en'
  }
})
