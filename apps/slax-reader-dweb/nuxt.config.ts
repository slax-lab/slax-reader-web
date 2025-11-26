import { getDWebConfig, getEnv } from '../../configs/env'
import replace from '@rollup/plugin-replace'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const env = getEnv()
const isDev = env === 'development'
const isPreview = env === 'preview'
console.log('Current env is:', env)

const envConfig = getDWebConfig()

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url))
  },

  app: {
    head: {
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: isDev || isPreview ? '/favicon.d.ico' : '/favicon.ico'
        }
      ]
    }
  },

  srcDir: 'src/',

  modules: ['@nuxtjs/turnstile', 'nuxt-og-image', 'nuxt-schema-org', '@nuxtjs/robots', '@nuxtjs/sitemap', 'nuxt-site-config', '@vite-pwa/nuxt', '@nuxt/test-utils/module'],
  future: {
    compatibilityVersion: 3
  },

  runtimeConfig: {
    public: {
      ...envConfig
    }
  },

  sourcemap: false,
  vite: {
    plugins: [],
    build: isDev
      ? {
          sourcemap: true,
          minify: false
        }
      : {
          // Enabling sourcemaps with Vue during development is known to cause problems with Vue
          sourcemap: false,
          minify: 'terser',
          terserOptions: {
            maxWorkers: 5,
            mangle: true,
            compress: isPreview
              ? undefined
              : {
                  drop_console: true,
                  drop_debugger: true
                },
            output: {
              beautify: true,
              comments: false,
              ascii_only: true
            }
          }
        }
  },
  nitro: {
    publicAssets: [
      {
        dir: 'public',
        baseURL: '/',
        maxAge: 0
      }
    ],
    preset: 'cloudflare-pages',
    output: {
      dir: 'dist'
    },
    prerender: {
      routes: ['/zh', '/en', '/privacy', '/terms', '/sitemap.xml', '/robots.txt'],
      autoSubfolderIndex: false,
      crawlLinks: true,
      failOnError: true
    },
    routeRules: {
      ...['/', '/bookmarks', '/user', '/login', '/guide', '/auth'].reduce(
        (rules, route) => {
          rules[route] = { ssr: false, prerender: true }
          return rules
        },
        {} as Record<string, { ssr: false; prerender: true }>
      ),
      ...['/bookmarks/**', '/w/**', '/sw/**'].reduce(
        (rules, route) => {
          rules[route] = { ssr: false, prerender: false }
          return rules
        },
        {} as Record<string, { ssr: false; prerender: false }>
      ),
      ...['/s/**'].reduce(
        (rules, route) => {
          rules[route] = { ssr: true, prerender: false }
          return rules
        },
        {} as Record<string, { ssr: true; prerender: false }>
      ),
      ...['/privacy', '/terms'].reduce(
        (rules, route) => {
          rules[route] = { ssr: true, prerender: true }
          return rules
        },
        {} as Record<string, { ssr: true; prerender: true }>
      ),
      '/b': { redirect: '/bookmarks' }
    },
    cloudflare: {
      pages: {
        routes: {
          include: ['/s/*', '/__og-image__/image/*']
        }
      }
    }
  },
  turnstile: {
    siteKey: `${envConfig.TURNSTILE_SITE_KEY || ''}`
  },
  experimental: {
    payloadExtraction: false,
    sharedPrerenderData: false
  },
  robots: {
    sitemap: [`/sitemap.xml`],
    groups: [
      {
        allow: [`/zh`, '/en', '/s/*'],
        disallow: ['/bookmarks', '/user', '/login', '/guide', '/auth']
      }
    ],
    credits: false
  },
  site: {
    enabled: true,
    indexable: !isDev,
    url: envConfig.PUBLIC_BASE_URL,
    name: 'Slax Reader'
  },
  sitemap: {
    enabled: true,
    minify: true,
    autoLastmod: true,
    sitemaps: {
      home: {
        urls: () => {
          const date = new Date('2024-11-21')
          return [
            {
              loc: '/',
              lastmod: date
            },
            {
              loc: '/zh',
              lastmod: date
            },
            {
              loc: '/en',
              lastmod: date
            }
          ]
        }
      },
      share: {
        include: ['/s/**']
      }
    }
  },
  schemaOrg: {
    enabled: true,
    identity: {
      url: `${envConfig.SHARE_BASE_URL || ''}`,
      name: 'Slax Reader',
      logo: '/images/logo.png',
      sameAs: ['https://slax.com/', 'https://note.slax.com/', 'https://r.slax.com/', 'https://x.com/wulujia']
    }
  },
  ogImage: {
    enabled: true,
    fonts: [
      { name: 'PingFang SC Regular', weight: 400, path: '../../layers/core/public/fonts/pingfang-sc-regular.woff' },
      {
        name: 'source-serif-pro-400-normal',
        weight: 400,
        path: '../../layers/core/public/fonts/source-serif-pro-400-normal.woff'
      }
    ]
  },
  pwa: {
    mode: !isDev ? 'production' : 'development',
    manifest: {
      id: 'com.app.slax_reader',
      name: 'Slax Reader',
      short_name: 'slax-reader',
      description: 'Simple reading, relax thinking',
      theme_color: '#F5F5F3',
      start_url: '/bookmarks',
      display_override: ['fullscreen', 'minimal-ui'],
      icons: [
        {
          src: 'pwaicon@192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwaicon@512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ],
      screenshots: [
        {
          src: '/screenshots/bookmark.png',
          sizes: '1280x800',
          type: 'image/png',
          form_factor: 'wide',
          label: 'Slax Reader Bookmark'
        },
        {
          src: '/screenshots/ai-summary.png',
          sizes: '1280x800',
          type: 'image/png',
          form_factor: 'wide',
          label: 'Slax Reader AI Summary'
        },
        {
          src: '/screenshots/chatbot.png',
          sizes: '1280x800',
          type: 'image/png',
          form_factor: 'wide',
          label: 'Slax Reader Chatbot'
        }
      ]
    },
    scope: '/',
    registerWebManifestInRouteRules: true,
    srcDir: './service-worker',
    filename: isDev ? 'sw_dev.ts' : 'sw_prod.ts',
    strategies: 'injectManifest',
    registerType: 'autoUpdate',
    injectRegister: false,
    includeManifestIcons: false,
    injectManifest: {
      maximumFileSizeToCacheInBytes: 5000000,
      globPatterns: ['**/*.{ico,png,jpg,jpeg,svg,gif,webp,woff}'],
      buildPlugins: {
        rollup: [
          replace({
            preventAssignment: true,
            values: {
              'process.env.__DWEB_API_BASE_URL__': `"${envConfig.DWEB_API_BASE_URL}"`
            }
          })
        ]
      }
    },
    devOptions: {
      enabled: isDev,
      type: 'module'
    }
  },
  hooks: {
    'build:before': () => {
      console.log('build:before, copy liveproxy-sw file...')
      const swSource = path.resolve(__dirname, 'node_modules/@slax-lab/liveproxy-sw/dist/liveproxy-sw.js')
      const swDest = path.resolve(__dirname, 'src/public/liveproxy-sw.js')
      fs.copyFileSync(swSource, swDest)
    }
  },
  compatibilityDate: '2024-09-19'
})
