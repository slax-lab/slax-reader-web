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
          content: 'var(--slax-content-w)',
          'content-min': 'var(--slax-content-min-w)',
          'side-panel': 'var(--slax-side-panel-w)',
          'side-panel-min': 'var(--slax-side-panel-min-w)',
          'side-panel-max': 'var(--slax-side-panel-max-w)'
        },
        maxWidth: {
          shell: 'var(--slax-shell-w)',
          content: 'var(--slax-content-w)',
          'side-panel-max': 'var(--slax-side-panel-max-w)'
        },
        minWidth: {
          content: 'var(--slax-content-min-w)',
          'side-panel-min': 'var(--slax-side-panel-min-w)'
        },
        height: {
          header: 'var(--slax-header-height)'
        },
        fontSize: {
          // 字号语义 8 档（来源：design-system §3）。业务侧 text-display / text-h2 / text-card / ...
          // 直接消费；非标值（15/18/24/34）在 task2 期间已按最近档映射，详见 .claude/task2-fontsize-shifts.md
          display: 'var(--slax-fs-display)',
          h2: 'var(--slax-fs-h2)',
          brand: 'var(--slax-fs-brand)',
          card: 'var(--slax-fs-card)',
          body: 'var(--slax-fs-body)',
          meta: 'var(--slax-fs-meta)',
          aux: 'var(--slax-fs-aux)',
          tag: 'var(--slax-fs-tag)'
        },
        fontFamily: {
          serif: ['Playfair Display', 'Noto Serif SC', 'serif'],
          sans: ['Inter', 'PingFang SC', '-apple-system', 'sans-serif'],
          mono: ['SF Mono', 'Fira Code', 'monospace']
        },
        // 特效参数桥接（来源：design-system §6）。业务侧 utility：
        //   duration-fast / duration-normal、ease-spring。Tailwind 的 backdrop-blur 因接受
        //   单一 blur(...) 函数无法表达 "blur(16px) saturate(150%)" 复合滤镜，故 backdrop-filter
        //   仍直接写 `backdrop-filter: var(--slax-blur)`，不在此桥接 backdropBlur key。
        transitionDuration: {
          fast: 'var(--slax-dur-fast)',
          normal: 'var(--slax-dur-normal)'
        },
        transitionTimingFunction: {
          spring: 'var(--slax-ease-spring)'
        }
      }
    }
  ])
)
