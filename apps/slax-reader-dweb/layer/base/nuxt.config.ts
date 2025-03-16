import { getDWebConfig, getEnv } from '../../../../configs/env'
import replace from '@rollup/plugin-replace'
import { fileURLToPath } from 'url'

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
        path: './components/global',
        global: true
      }
    ]
  }
})
