import autoMigrateIcons from './plugins/auto-migrate-icons.plugin'
import toUtf8 from './plugins/vite-plugin-to-utf8'

import { getEnv, getExtensionsConfig } from '../../configs/env'
import pkg from './package.json'
import { vendorExternalize } from './vendor.config'
import path from 'path'
import { defineConfig } from 'wxt'

const env = getEnv()
const isDev = env === 'development'
const isPreview = env === 'preview'
console.log('Current env is:', env)

// dev-only vendor 外置，见 vendor.config.ts
const vendor = vendorExternalize(__dirname, isDev)
if (vendor.useVendor) {
  console.log('[vendor] 已启用 vendor 外置（dev 提速）：markmap / highlight.js / katex 走预打包 vendor.js')
}

const Version = pkg.version || ''
const envConfig = getExtensionsConfig()

const convertToProcessEnv = (envConfig: Record<string, unknown>) => {
  const result: Record<string, string> = {}
  for (const key in envConfig) {
    result[`process.env.${key}`] = JSON.stringify(envConfig[key] || '')
  }

  result['process.env.SLAX_ENV'] = JSON.stringify(env)
  result['process.env.VERSION'] = JSON.stringify(Version)

  return result
}

// See https://wxt.dev/api/config.html
export default defineConfig({
  imports: {
    addons: {
      vueTemplate: true
    }
  },
  modules: ['@wxt-dev/module-vue', '@wxt-dev/analytics/module', '@wxt-dev/i18n/module', '@wxt-dev/unocss'],
  manifest: {
    name: 'Slax Reader',
    version: Version,
    description: 'An AI-powered browser extension that generates outlines and highlights key points to enhance your web reading experience.',
    default_locale: 'en',
    permissions: ['storage', 'tabs', 'activeTab', 'sidePanel', 'cookies', 'contextMenus', 'alarms'],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'"
    },
    host_permissions: (
      {
        production: ['https://*.slax.app/', 'https://*.slax.com/'],
        beta: ['https://*.slax.app/', 'https://*.slax.com/']
      } as Record<string, string[]>
    )[env] ?? ['https://*.slax.dev/'],
    action: {
      default_icon: {
        '16': 'icon/16.png',
        '32': 'icon/32.png',
        '48': 'icon/48.png',
        '128': 'icon/128.png'
      }
    },
    icons: {
      '16': 'icon/16.png',
      '32': 'icon/32.png',
      '48': 'icon/48.png',
      '128': 'icon/128.png'
    },
    minimum_chrome_version: '115',
    commands: {
      open_collect: {
        suggested_key: {
          default: 'Alt+Y',
          mac: 'Alt+Y',
          linux: 'Alt+Y'
        },
        description: 'Open the collect popup'
      }
    }
  },
  srcDir: 'src',
  outDir: 'build',
  dev: {
    server: {
      port: 3001
    }
  },

  vite: () => ({
    plugins: [toUtf8()],
    define: {
      ...convertToProcessEnv(envConfig)
    },
    build: isDev
      ? {
          // dev 默认关 sourcemap 提速
          // 调试用 SLAX_SOURCEMAP=1 pnpm dev
          sourcemap: process.env.SLAX_SOURCEMAP === '1' || process.env.SLAX_SOURCEMAP === 'true',
          minify: false
        }
      : {
          sourcemap: false,
          minify: 'esbuild'
        },
    esbuild: !isDev && !isPreview ? { drop: ['console', 'debugger'] } : undefined,
    resolve: {
      alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }, ...vendor.aliases]
    }
  }),
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => {
      manifest.content_scripts ??= []
      manifest.content_scripts.push({
        css: ['content-scripts/mark.css'],
        matches: ['<all_urls>'],
        run_at: 'document_idle'
      })
      vendor.extendManifest(manifest)
    },
    // 'vite:build:extendConfig': (entries, config) => {
    //   const entryNames = entries.reduce((set, entry) => {
    //     set.add(entry.name)
    //     return set
    //   }, new Set<string>())
    //   if (entryNames.has('content')) {
    //     config.plugins!.push(UnoCSS(), autoImportUnoCSS(['content/index.ts']))
    //   }
    // },
    // 'vite:devServer:extendConfig': config => {
    //   config.plugins!.push(UnoCSS(), autoImportUnoCSS(['content/index.ts']))
    // },
    'build:publicAssets': (wxt, files) => {
      autoMigrateIcons(getEnv())(wxt, files)
      vendor.extendPublicAssets(files)
    }
  },
  webExt: {
    chromiumArgs: isDev ? ['--disable-blink-features=AutomationControlled'] : []
  }
})
