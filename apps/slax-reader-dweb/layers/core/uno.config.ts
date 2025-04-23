import baseConfig from '../../../../uno.config'
import { defineConfig, mergeConfigs } from 'unocss'

export default defineConfig(mergeConfigs([baseConfig, {}]))
