// 插件是否置顶到浏览器工具栏：chrome.action.getUserSettings/onUserSettingsChanged 只能在 background
// 特权上下文调用，content script 转发查询 + 把结果写到 shadow host 的 data 属性，供 dweb 页面 DOM 探测读取。
// fork content script 通过 @public 别名复用本文件，避免两份重复实现。
import { type MessageType, MessageTypeAction } from '@/config/message'

const PINNED_ATTR = 'data-slax-pinned'

const setPinnedAttr = (shadowHost: HTMLElement, isOnToolbar: boolean) => {
  shadowHost.setAttribute(PINNED_ATTR, String(isOnToolbar))
}

const queryPinnedStatus = async (shadowHost: HTMLElement) => {
  try {
    const res = await browser.runtime.sendMessage<{ action: MessageTypeAction.QueryPinnedStatus }, { success: true; data: { isOnToolbar: boolean } } | { success: false }>({
      action: MessageTypeAction.QueryPinnedStatus
    })
    if (res?.success) setPinnedAttr(shadowHost, res.data.isOnToolbar)
  } catch {
    // background 未就绪等场景静默失败，下次 visibilitychange 会重试
  }
}

// 主路径：background 监听 chrome.action.onUserSettingsChanged 后主动推送，覆盖用户全程停留在
// 本页可见状态下点拼图图标固定/取消固定插件的场景——这种情况下 visibilitychange 永远不会触发。
// visibilitychange 仅作为兜底重新查询（如插件在标签页打开前已置顶，或消息丢失时的补偿）。
export const watchPinnedStatus = (shadowHost: HTMLElement) => {
  queryPinnedStatus(shadowHost)

  const onMessage = (message: unknown) => {
    const receiveMessage = message as MessageType
    if (receiveMessage.action === MessageTypeAction.PinnedStatusUpdate) {
      setPinnedAttr(shadowHost, receiveMessage.isOnToolbar)
    }
  }
  browser.runtime.onMessage.addListener(onMessage)

  const onVisible = () => {
    if (document.visibilityState === 'visible') queryPinnedStatus(shadowHost)
  }
  document.addEventListener('visibilitychange', onVisible)

  return () => {
    browser.runtime.onMessage.removeListener(onMessage)
    document.removeEventListener('visibilitychange', onVisible)
  }
}
