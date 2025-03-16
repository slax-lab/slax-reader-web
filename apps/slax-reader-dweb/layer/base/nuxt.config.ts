import { getDWebConfig, getEnv } from '../../../../configs/env'
import replace from '@rollup/plugin-replace'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const currentDir = dirname(fileURLToPath(import.meta.url))
const env = getEnv()
const isDev = env === 'development'
const isPreview = env === 'preview'
console.log('Current env is:', env)

const envConfig = getDWebConfig()

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  $meta: {
    name: 'base'
  },
  components: {
    dirs: [
      {
        path: join(currentDir, './components/global'),
        global: true
      }
    ]
  },
  css: [, join(currentDir, './styles/global.scss')]
})
