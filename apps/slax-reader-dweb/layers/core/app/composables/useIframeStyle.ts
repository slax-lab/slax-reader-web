import { type Ref, unref, watch } from 'vue'

interface UseIframeStylesOptions {
  injectOnLoad?: boolean
  styleId?: string
}

const DEFAULT_OPTIONS: Required<UseIframeStylesOptions> = {
  injectOnLoad: true,
  styleId: 'slax-reader-injected-css'
}

export function useIframeStyles(iframeRef: Ref<HTMLIFrameElement | null>, cssContent: string | Ref<string>, options: UseIframeStylesOptions = {}) {
  // 合并模式而非默认值赋值：避免调用方传 { styleId } 时 injectOnLoad 被覆盖为 undefined
  const { injectOnLoad, styleId } = { ...DEFAULT_OPTIONS, ...options }

  const getCss = () => unref(cssContent)

  const injectCssToIframe = () => {
    const iframe = iframeRef.value
    if (!iframe || !iframe.contentDocument) return false

    let styleEl = iframe.contentDocument.getElementById(styleId) as HTMLStyleElement | null
    if (styleEl) {
      // 已存在：更新 textContent 支持主题切换或 Ref<string> 热更新
      const next = getCss()
      if (styleEl.textContent !== next) styleEl.textContent = next
      return true
    }

    styleEl = iframe.contentDocument.createElement('style')
    styleEl.id = styleId
    styleEl.textContent = getCss()
    iframe.contentDocument.head?.appendChild(styleEl)
    return true
  }

  const setupLoadListener = (iframe: HTMLIFrameElement) => {
    const onLoad = () => injectCssToIframe()
    iframe.addEventListener('load', onLoad)
    if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
      injectCssToIframe()
    }
    return () => iframe.removeEventListener('load', onLoad)
  }

  // 单一入口：watch + immediate: true
  //   - setup 阶段跑一次：template ref 仍是 null，被 !newIframe 跳过
  //   - mounted 后 Vue 把 template ref 赋值，触发 watch 真正挂载 listener
  //   - 后续 iframeRef 任何变化都自动走 onCleanup → 重挂，无重复无泄漏
  watch(
    iframeRef,
    (newIframe, _oldIframe, onCleanup) => {
      if (!injectOnLoad || !newIframe) return
      const cleanup = setupLoadListener(newIframe)
      onCleanup(() => cleanup?.())
    },
    { immediate: true }
  )

  // 若 cssContent 是 Ref，变更时尝试更新已存在的 <style>
  if (typeof cssContent !== 'string') {
    watch(cssContent, () => injectCssToIframe())
  }

  return { injectCssToIframe }
}
