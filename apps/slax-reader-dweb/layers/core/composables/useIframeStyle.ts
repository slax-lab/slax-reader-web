import { onMounted, type Ref, watch } from 'vue'

export function useIframeStyles(iframeRef: Ref<HTMLIFrameElement | null>, cssContent: string, options = { injectOnLoad: true }) {
  const injectCssToIframe = () => {
    const iframe = iframeRef.value
    if (!iframe || !iframe.contentDocument) return false

    const styleId = 'slax-reader-injected-css'
    if (iframe.contentDocument.getElementById(styleId)) {
      return true
    }

    const styleEl = iframe.contentDocument.createElement('style')
    styleEl.id = styleId
    styleEl.textContent = cssContent

    const iframeHead = iframe.contentDocument.head
    if (iframeHead) {
      iframeHead.appendChild(styleEl)
      return true
    }

    return false
  }

  const setupIframeLoadListener = () => {
    const iframe = iframeRef.value
    if (!iframe) return

    const handleLoad = () => {
      injectCssToIframe()
    }

    iframe.addEventListener('load', handleLoad)

    if (iframe.contentDocument && iframe.contentDocument.readyState === 'complete') {
      injectCssToIframe()
    }

    return () => {
      iframe.removeEventListener('load', handleLoad)
    }
  }

  watch(iframeRef, (newIframe, oldIframe) => {
    if (newIframe && newIframe !== oldIframe) {
      setupIframeLoadListener()
    }
  })

  onMounted(() => {
    if (options.injectOnLoad) {
      const cleanup = setupIframeLoadListener()
      // 在组件卸载时清理（通常由 Vue 的 setup 函数自动处理）
    }
  })

  return {
    injectCssToIframe
  }
}
