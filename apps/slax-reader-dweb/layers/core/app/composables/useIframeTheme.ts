import { type Ref, watch } from 'vue'

import { useIframeStyles } from './useIframeStyle'
// 通过 ?raw 把 token-only CSS 文本嵌入 bundle，运行时注入 iframe 的 <head>
import tokensCss from '#layers/core/styles/theme.tokens.css?raw'

/**
 * 让 iframe 跟随主站主题切换：
 *   1. 把 theme.tokens.css（仅 :root / [data-slax-theme] 变量块）注入 iframe head。
 *      使用私有 styleId 'slax-reader-theme-tokens'，与现有 markCss 注入并存。
 *      关键：必须用 theme.tokens.css，绝不能改成 theme.css —— 后者含有
 *      html/body 全局兜底、E-ink 通配禁用、View Transition 禁用等主站规则，
 *      注入 iframe 会改用户保存的原网页背景/字体/动画。
 *   2. 同步 <html data-slax-theme="..."> 到 iframe，避开 daisyUI 等使用
 *      `data-theme` 的网页命名空间。
 *   3. 监听 iframe `load` 事件：iframeRef.value!.src = ... 触发 reload 时
 *      iframeRef 引用不变，仅靠 watch(iframeRef, ...) 不会触发，新 document
 *      丢失 data-slax-theme。必须在 load 后重设。
 *   4. watch 用 onCleanup 移除旧 listener，防 iframeRef 替换泄漏。
 */
export function useIframeTheme(iframeRef: Ref<HTMLIFrameElement | null>) {
  const colorMode = useColorMode()

  // 注入 token-only CSS（独立 styleId 与 markCss 共存）
  useIframeStyles(iframeRef, tokensCss, { styleId: 'slax-reader-theme-tokens' })

  const syncDataTheme = () => {
    const doc = iframeRef.value?.contentDocument
    if (!doc) return
    doc.documentElement.setAttribute('data-slax-theme', colorMode.value)
  }

  const setupLoadListener = (iframe: HTMLIFrameElement) => {
    const onLoad = () => syncDataTheme()
    iframe.addEventListener('load', onLoad)
    if (iframe.contentDocument && iframe.contentDocument.readyState !== 'loading') {
      syncDataTheme()
    }
    return () => iframe.removeEventListener('load', onLoad)
  }

  // colorMode 切换时同步当前 document
  watch(() => colorMode.value, syncDataTheme)

  // iframeRef 任何变化都走单一 watch 路径，与 useIframeStyles 注册模式对齐
  watch(
    iframeRef,
    (newIframe, _oldIframe, onCleanup) => {
      if (!newIframe) return
      const cleanup = setupLoadListener(newIframe)
      onCleanup(() => cleanup?.())
    },
    { immediate: true }
  )

  return { syncDataTheme }
}
