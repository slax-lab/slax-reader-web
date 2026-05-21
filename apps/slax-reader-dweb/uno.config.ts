// dweb 项目根 UnoCSS 配置：通过 mergeConfigs 在 monorepo 根 uno.config.ts 之上追加 dweb 专属 theme 桥接。
//
// 为什么放在项目根而不是 layers/core/：@unocss/nuxt v66 不会自动合并 Nuxt layer 内的 uno.config.ts，
// 它只读 Nuxt 项目根（即 apps/slax-reader-dweb/）的 uno.config.ts。把桥接放在 layer 里会导致 utility
// 类（如 bg-surface / text-txt）不被生成，只有 theme.tokens.css 自身的 :root 定义被打包。
// extensions（apps/slax-reader-extensions/uno.config.ts）只 merge 仓库根 uno.config.ts，与本文件无关，
// 因此 dweb 端的 theme 桥接不会污染浏览器扩展。
import baseConfig from '../../uno.config'
import { defineConfig, mergeConfigs } from 'unocss'

export default defineConfig(
  mergeConfigs([
    baseConfig,
    {
      theme: {
        // 扁平结构而非嵌套 { DEFAULT, ... }：UnoCSS 在嵌套 colors 上的 DEFAULT 隐式映射在
        // 当前 preset 组合（preset-wind3 + presetAttributify + presetRemToPx）下未稳定生效。
        // 扁平 key 让 `text-txt` / `bg-accent-bg` / `border-border` 等 utility 100% 走到 var(--slax-*)。
        colors: {
          bg: 'var(--slax-bg)',
          surface: 'var(--slax-surface)',
          'surface-solid': 'var(--slax-surface-solid)',
          'topbar-bg': 'var(--slax-topbar-bg)',
          border: 'var(--slax-border)',

          txt: 'var(--slax-text)',
          'txt-muted': 'var(--slax-text-muted)',
          'txt-light': 'var(--slax-text-light)',
          'txt-btn': 'var(--slax-btn-text)',

          accent: 'var(--slax-accent)',
          'accent-soft': 'var(--slax-accent-soft)',
          'accent-bg': 'var(--slax-accent-bg)',

          danger: 'var(--slax-danger)',
          'danger-bg': 'var(--slax-danger-bg)',

          selection: 'var(--slax-selection)'
        },
        boxShadow: {
          warm: 'var(--slax-shadow-warm)',
          sm: 'var(--slax-shadow-sm)'
        },
        borderRadius: {
          DEFAULT: 'var(--slax-radius)',
          sm: 'var(--slax-radius-sm)'
        },
        width: {
          sidebar: 'var(--slax-sidebar-w)',
          shell: 'var(--slax-shell-w)',
          content: 'var(--slax-content-w)'
        },
        maxWidth: {
          shell: 'var(--slax-shell-w)',
          content: 'var(--slax-content-w)'
        },
        height: {
          header: 'var(--slax-header-height)'
        },
        fontFamily: {
          serif: ['Playfair Display', 'Noto Serif SC', 'serif'],
          sans: ['Inter', 'PingFang SC', '-apple-system', 'sans-serif'],
          mono: ['SF Mono', 'Fira Code', 'monospace']
        }
      }
    }
  ])
)
