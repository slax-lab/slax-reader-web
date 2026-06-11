import type { DOMProcessor, WebProcessorContext } from './types'

/**
 * ClassIsolationProcessor —— 把 v-html 正文里"外来 class"前缀化，使其不再命中全站的 UnoCSS 原子类。
 *
 * 背景：UnoCSS 是编译期扫描源码产出全局 CSS（例如别处用了 `w-0`，就会全局生成 `.w-0{width:0}`），
 * 它并不会扫描运行时的 v-html。但原文 HTML 里若残留了同名 class（w-0 / hidden / flex …），
 * 这些全局原子规则就会"误伤"正文。碰撞面 =（全站用过的 utility）∩（原文残留 class），开放且不可枚举，
 * 因此逐个 blocklist 无解，只能让正文里的 class 不再匹配——即统一加前缀。
 *
 * 策略：遍历 `.html-text` 下所有带 class 的元素，把每个 class token 加上 `oc-`（original content）前缀，
 * 但保留 reader 自己依赖的 class（见 RESERVED_*），否则会破坏推特卡片 / PhotoSwipe / 代码高亮 / KaTeX。
 *
 * 必须排在 pipeline 最前：后续 processor 新增的 class（slax-image-loading / has-li / CE 元素等）是 reader 自己产出的，
 * 不应被前缀化；先隔离、后处理即可天然规避。
 */

const PREFIX = 'oc-'

// reader 正文样式（layers/core/styles/article/*.scss）直接依赖的内容态 class：保持原样。
const RESERVED_EXACT = new Set([
  // 通用 / 列表
  'has-li',
  'img-caption',
  // 推特卡片（_twitter.scss）
  'tweet',
  'tweet-content',
  'tweet-header',
  'tweet-footer',
  'tweet-media',
  'tweet-user-info',
  'quote-tweet',
  'quote-tweet-container',
  'quote-header',
  'quote-title',
  'quote-media',
  'quote-link',
  'quote-description',
  'author',
  'name',
  'nickname',
  'desc',
  'description',
  'display',
  'title',
  'text-section',
  'photo-section',
  'profile-image',
  'banner-overlay',
  'additional-info',
  'followers-following',
  // PhotoSwipe 专题（_photo-swipe-topic.scss）
  'topic-container',
  'swiper',
  'swiper-slide'
])

// 前缀放行：CE 组件 / 划线（slax-*）、KaTeX（katex*）、github 语法高亮 token（pl-*）。
const isReservedToken = (token: string): boolean =>
  RESERVED_EXACT.has(token) || token.startsWith('slax') || token.startsWith('katex') || token.startsWith('pl-')

export class ClassIsolationProcessor implements DOMProcessor {
  readonly name = 'ClassIsolationProcessor'

  match(): boolean {
    return true
  }

  process(context: WebProcessorContext): void {
    const root = context.container.querySelector<HTMLElement>(':scope > .html-text')
    if (!root) return

    // 用 getAttribute/setAttribute 操作 class，兼容 SVG 元素（SVG 的 .className 不是普通字符串）。
    const elements = Array.from(root.querySelectorAll<HTMLElement>('[class]'))

    for (const el of elements) {
      // KaTeX 子树整体跳过：公式内部有大量裸 class（mord/base/strut/vlist…）由 katex.css 驱动，
      // 前缀化会直接破坏渲染。.katex 容器本身已在放行名单内。
      if (el.closest('.katex')) continue

      const raw = el.getAttribute('class')
      if (!raw) continue

      const next = raw
        .split(/\s+/)
        .filter(Boolean)
        .map(token => (isReservedToken(token) || token.startsWith(PREFIX) ? token : `${PREFIX}${token}`))
        .join(' ')

      if (next !== raw) {
        el.setAttribute('class', next)
      }
    }
  }
}
