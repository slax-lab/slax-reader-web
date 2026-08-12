// 检测 Slax Reader 浏览器扩展是否安装：扩展无 externally_connectable/postMessage 通道，
// 只能通过 content script 注入的 DOM 标记（WXT createShadowRootUi 的宿主元素）探测。
import { onMounted, onUnmounted, ref } from 'vue'

const EXTENSION_MARKERS = ['slax-reader-panel', 'slax-reader-modal']
const DETECTION_TIMEOUT = 1500

export function useExtensionDetection() {
  const isInstalled = ref(false)
  const checked = ref(false)

  onMounted(() => {
    const matchMarker = () => EXTENSION_MARKERS.some(tag => document.querySelector(tag))

    if (matchMarker()) {
      isInstalled.value = true
      checked.value = true
      return
    }

    // content script 在 document_idle 注入，可能比本组件 mount 晚；
    // MutationObserver 监听 + 超时兜底判定"未安装"
    const observer = new MutationObserver(() => {
      if (matchMarker()) {
        isInstalled.value = true
        checked.value = true
        observer.disconnect()
        clearTimeout(timer)
      }
    })
    // WXT createShadowRootUi 的宿主元素以 body 兄弟节点插入（<html> 的孙节点或更深），
    // 必须 subtree:true 才能捕获；仅 childList 只观察 <html> 的直接子节点。
    observer.observe(document.documentElement, { childList: true, subtree: true })

    const timer = setTimeout(() => {
      checked.value = true
      observer.disconnect()
    }, DETECTION_TIMEOUT)

    onUnmounted(() => {
      observer.disconnect()
      clearTimeout(timer)
    })
  })

  return { isInstalled, checked }
}
