// dweb 项目的 UnoCSS theme 桥接已经挪到 apps/slax-reader-dweb/uno.config.ts（项目根），
// 因为 @unocss/nuxt v66 不会自动合并 Nuxt layer 内的 uno.config.ts。
// 本文件保留 mergeConfigs 占位，便于未来如有 layer 专属规则可在此追加。
import baseConfig from '../../../../uno.config'
import { defineConfig, mergeConfigs } from 'unocss'

export default defineConfig(mergeConfigs([baseConfig, {}]))
