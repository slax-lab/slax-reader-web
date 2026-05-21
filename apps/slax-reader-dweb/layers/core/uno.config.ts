import baseConfig from '../../../../uno.config'
import { defineConfig, mergeConfigs } from 'unocss'

// dweb 专属 theme 桥接：经 UnoCSS mergeConfigs → mergeThemes → mergeDeep 深合并到根 theme
// 仅 dweb 编译产物受影响；extensions 加载根 config 时不会拿到这些覆盖（不污染浏览器扩展）
//
// 所有 var() 引用使用 --slax-* 私有前缀，与 theme.tokens.css 中的变量名一致
// 业务侧语义类名（bg-surface / text-txt / shadow-warm 等）不变：UnoCSS theme.colors 的
// key 名与 var() 字符串解耦，前缀化只影响编译产物里的 background: var(--slax-bg) 等具体值
export default defineConfig(
  mergeConfigs([
    baseConfig,
    {
      theme: {
        colors: {
          bg: 'var(--slax-bg)',
          surface: 'var(--slax-surface)',
          'surface-solid': 'var(--slax-surface-solid)',
          'topbar-bg': 'var(--slax-topbar-bg)',
          border: 'var(--slax-border)',

          txt: {
            DEFAULT: 'var(--slax-text)',
            muted: 'var(--slax-text-muted)',
            light: 'var(--slax-text-light)',
            btn: 'var(--slax-btn-text)'
          },

          accent: {
            DEFAULT: 'var(--slax-accent)',
            soft: 'var(--slax-accent-soft)',
            bg: 'var(--slax-accent-bg)'
          },

          danger: {
            DEFAULT: 'var(--slax-danger)',
            bg: 'var(--slax-danger-bg)'
          },

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
