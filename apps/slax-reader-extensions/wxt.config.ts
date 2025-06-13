import autoMigrateIcons from './plugins/auto-migrate-icons.plugin'
import toUtf8 from './plugins/vite-plugin-to-utf8'

import { getEnv, getExtensionsConfig } from '../../configs/env'
import path from 'path'
import { defineConfig } from 'wxt'

const env = getEnv()
const isDev = env === 'development'
const isPreview = env === 'preview'
console.log('Current env is:', env)

const Version = '1.5.8'
const envConfig = getExtensionsConfig()

const convertToProcessEnv = (env: Record<string, unknown>) => {
  const result: Record<string, string> = {}
  for (const key in env) {
    result[`process.env.${key}`] = JSON.stringify(env[key] || '')
  }

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
          sourcemap: true,
          minify: false
        }
      : {
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
        },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
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
    'build:publicAssets': autoMigrateIcons(getEnv())
  }
})
