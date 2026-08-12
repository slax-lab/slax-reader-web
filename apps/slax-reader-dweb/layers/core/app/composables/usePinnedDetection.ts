// 检测 Slax Reader 扩展是否已固定到浏览器工具栏。
// chrome.action.getUserSettings() 只能在扩展特权上下文（background）调用，扩展 content script
// 转发查询后，把结果写到 slax-reader-panel/slax-reader-modal 宿主元素的 data-slax-pinned 属性上——
// 这里通过 DOM 属性探测读取该值，而非重新发起跨扩展通信（网页本身无法直接调用扩展 API）。
//
// 旧版本扩展没有这段上报逻辑，属性永远不存在，isPinned 会一直是 false——不做超时兜底判定，
// UI 侧应始终提供手动确认按钮作为逃生舱，不依赖本 composable 必然给出结论。
import { onMounted, onUnmounted, ref } from 'vue'

const EXTENSION_MARKERS = ['slax-reader-panel', 'slax-reader-modal']
const PINNED_ATTR = 'data-slax-pinned'

export function usePinnedDetection() {
  const isPinned = ref(false)

  onMounted(() => {
    const findMarker = () => EXTENSION_MARKERS.map(tag => document.querySelector(tag)).find((el): el is Element => !!el)

    const readAttr = (el: Element) => {
      isPinned.value = el.getAttribute(PINNED_ATTR) === 'true'
    }

    let attrObserver: MutationObserver | undefined
    const observeAttr = (el: Element) => {
      readAttr(el)
      attrObserver?.disconnect()
      attrObserver = new MutationObserver(() => readAttr(el))
      attrObserver.observe(el, { attributes: true, attributeFilter: [PINNED_ATTR] })
    }

    // 宿主元素可能比本组件 mount 晚出现（content script document_idle 注入），
    // 用 childList + subtree 监听其出现，出现后转为监听该元素的属性变化
    const existing = findMarker()
    if (existing) {
      observeAttr(existing)
    } else {
      const presenceObserver = new MutationObserver(() => {
        const marker = findMarker()
        if (marker) {
          presenceObserver.disconnect()
          observeAttr(marker)
        }
      })
      presenceObserver.observe(document.documentElement, { childList: true, subtree: true })
      onUnmounted(() => presenceObserver.disconnect())
    }

    // 用户从"点拼图图标固定扩展"切回本页会触发 visibilitychange/focus；
    // 属性可能在页面不可见期间已写好最终值，重新可见时主动读一次当前值（不能只等 mutation）
    const recheck = () => {
      const marker = findMarker()
      if (marker) readAttr(marker)
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') recheck()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', recheck)

    onUnmounted(() => {
      attrObserver?.disconnect()
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', recheck)
    })
  })

  return { isPinned }
}
