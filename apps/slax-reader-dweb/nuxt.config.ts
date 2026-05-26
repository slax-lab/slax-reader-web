import { getDWebConfig, getEnv } from '../../configs/env'
import pkg from './package.json'
import replace from '@rollup/plugin-replace'
import fs from 'fs'
import path from 'path'

const env = getEnv()
const isDev = env === 'development'
const isPreview = env === 'preview'
const isProduction = env === 'production'
console.log('Current env is:', env)

const envConfig = getDWebConfig()

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

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

  modules: ['@nuxtjs/turnstile', 'nuxt-og-image', 'nuxt-schema-org', '@nuxtjs/robots', '@nuxtjs/sitemap', 'nuxt-site-config', '@vite-pwa/nuxt', '@nuxt/scripts'],

  future: {
    compatibilityVersion: 4
  },

  runtimeConfig: {
    public: {
      ...envConfig,
      appVersion: pkg.version
    }
  },

  // workaround for @unocss/nuxt v66 with Nuxt 4: 模块内的 cssnano 配置覆盖只检查 Nuxt 3
  // 详见 https://github.com/unocss/unocss/issues/<TODO> 及对应 PR
  postcss: {
    plugins: {
      cssnano: {
        preset: [
          'default',
          {
            mergeRules: false,
            normalizeWhitespace: false,
            discardComments: false
          }
        ]
      }
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
          minify: 'esbuild'
        },
    esbuild: !isDev && !isPreview ? { drop: ['console', 'debugger'] } : undefined,
    optimizeDeps: {
      include: [
        'ua-parser-js',
        'dompurify',
        'highlight.js',
        'markdown-it',
        'markdown-it/lib/token.mjs',
        '@vscode/markdown-it-katex',
        'markdown-it-link-attributes',
        'zod',
        'approx-string-match',
        'dom-anchor-text-position',
        'easy-dom2img',
        'markmap-common',
        'markmap-lib',
        'markmap-view',
        'jszip'
      ]
    }
  },
  content: {
    database: {
      type: 'd1',
      bindingName: 'DB'
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
      routes: ['/zh', '/en', '/download', '/privacy', '/terms', '/contact', '/sitemap.xml', '/robots.txt', '/how-do-i-delete-my-account', '/delete-account-notice'],
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
      ...['/privacy', '/terms', '/how-do-i-delete-my-account', '/delete-account-notice'].reduce(
        (rules, route) => {
          rules[route] = { ssr: false, prerender: false }
          return rules
        },
        {} as Record<string, { ssr: false; prerender: false }>
      ),
      ...['/download', '/contact'].reduce(
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
          include: ['/s/*', '/_og/d/*', '/_og/r/*']
        }
      }
    }
  },
  turnstile: {
    siteKey: `${envConfig.TURNSTILE_SITE_KEY || ''}`
  },
  experimental: {
    sharedPrerenderData: false
  },
  robots: {
    sitemap: [`/sitemap.xml`],
    groups: [
      {
        allow: [`/zh`, '/en', '/download', '/contact', '/s/*'],
        disallow: ['/bookmarks', '/user', '/login', '/guide', '/auth']
      }
    ],
    credits: false
  },
  site: {
    enabled: true,
    indexable: !isDev,
    url: envConfig.PUBLIC_BASE_URL as string,
    name: 'Slax Reader: Read Smarter, Save Forever'
  },
  sitemap: {
    enabled: true,
    minify: true,
    autoLastmod: true,
    sitemaps: {
      home: {
        urls: () => {
          const date = new Date('2026-02-03')
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
            },
            {
              loc: '/download',
              lastmod: date
            },
            {
              loc: '/contact',
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
      type: 'Organization',
      name: 'Slax Reader',
      logo: `${envConfig.PUBLIC_BASE_URL || ''}/logo.png`,
      url: `${envConfig.PUBLIC_BASE_URL || ''}/en`,
      sameAs: ['https://x.com/SlaxReader', 'https://t.me/slax_app', 'https://github.com/slax-lab/slax-reader', 'https://x.com/wulujia'],
      contactPoint: [
        {
          email: 'reader@slax.com',
          contactType: 'customer support'
        }
      ]
    }
  },
  ogImage: {
    enabled: true,
    fontSubsets: ['latin', 'chinese-simplified']
  },
  pwa: {
    mode: !isDev ? 'production' : 'development',
    manifest: {
      id: 'com.app.slax_reader',
      name: 'Slax Reader: Read Smarter, Save Forever',
      short_name: 'Slax Reader',
      description:
        'Slax Reader is the open-source read-later app for deep thinkers. Archive the web permanently, read smarter with AI instant summaries, interactive outline and deep-dive chat.',
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
      maximumFileSizeToCacheInBytes: 10000000,
      globPatterns: ['**/*.{ico,png,jpg,jpeg,svg,gif,webp,woff,woff2}'],
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
      const swDest = path.resolve(__dirname, 'public/liveproxy-sw.js')
      fs.copyFileSync(swSource, swDest)
    }
  },
  scripts: {
    registry: {
      googleTagManager: isDev
        ? 'mock'
        : {
            id: `${envConfig.GTM_CONTAINER_ID || ''}`
          }
    }
  },
  compatibilityDate: '2024-09-19'
})
