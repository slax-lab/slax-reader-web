// useExtensionDetection 单元测试
// 含 onMounted/onUnmounted，通过最小宿主组件挂载提供组件上下文。
import { defineComponent } from 'vue'

import { useExtensionDetection } from '~~/layers/core/app/composables/useExtensionDetection'
import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mountDetection = () => {
  let api: ReturnType<typeof useExtensionDetection> | undefined
  const Host = defineComponent({
    setup() {
      api = useExtensionDetection()
      return () => null
    }
  })
  const wrapper = mountWithApp(Host)
  return { wrapper, api: api! }
}

describe('useExtensionDetection', () => {
  afterEach(() => {
    vi.useRealTimers()
    document.querySelectorAll('slax-reader-panel, slax-reader-modal').forEach(el => el.remove())
  })

  it('挂载时 DOM 已含 slax-reader-panel：立即判定已安装', () => {
    const panel = document.createElement('slax-reader-panel')
    document.body.appendChild(panel)

    const { api } = mountDetection()
    expect(api.isInstalled.value).toBe(true)
    expect(api.checked.value).toBe(true)
  })

  it('挂载时 DOM 已含 slax-reader-modal：立即判定已安装', () => {
    const modal = document.createElement('slax-reader-modal')
    document.body.appendChild(modal)

    const { api } = mountDetection()
    expect(api.isInstalled.value).toBe(true)
    expect(api.checked.value).toBe(true)
  })

  it('挂载时无标记，之后异步插入：MutationObserver 命中后判定已安装', async () => {
    const { api } = mountDetection()
    expect(api.checked.value).toBe(false)

    const panel = document.createElement('slax-reader-panel')
    document.body.appendChild(panel)

    await vi.waitFor(() => {
      expect(api.checked.value).toBe(true)
    })

    expect(api.isInstalled.value).toBe(true)
  })

  it('超时未探测到标记：判定未安装', () => {
    vi.useFakeTimers()
    const { api } = mountDetection()

    expect(api.checked.value).toBe(false)
    vi.advanceTimersByTime(1500)

    expect(api.isInstalled.value).toBe(false)
    expect(api.checked.value).toBe(true)
  })

  it('组件卸载时清理 observer/timer，不再触发状态变更', () => {
    vi.useFakeTimers()
    const { wrapper, api } = mountDetection()

    wrapper.unmount()
    vi.advanceTimersByTime(1500)

    // 卸载后 timer 已清理，checked 保持挂载期间的最后值（未超时触发）
    expect(api.checked.value).toBe(false)
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })
})
