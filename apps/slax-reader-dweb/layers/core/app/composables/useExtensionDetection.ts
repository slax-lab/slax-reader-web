// 检测扩展是否安装：DOM 标记探测
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

    // 超时不代表停止监听，避免错过迟到的标记
    const observer = new MutationObserver(() => {
      if (matchMarker()) {
        isInstalled.value = true
        checked.value = true
        observer.disconnect()
        clearTimeout(timer)
      }
    })
    // 插入较深，须 subtree:true
    observer.observe(document.documentElement, { childList: true, subtree: true })

    const timer = setTimeout(() => {
      checked.value = true
    }, DETECTION_TIMEOUT)

    onUnmounted(() => {
      observer.disconnect()
      clearTimeout(timer)
    })
  })

  return { isInstalled, checked }
}
