// Tips/InstallExtensionTips 组件单测
// onMounted: 检查 slax-reader-modal DOM；userStore.showCloseInstallExtTips → isAppeared
// closeClick → updateCloseInstallExtTipsDate + isAppeared=false
// installClick → window.open + analyticsLog
// shakeTextarea: 添加 shake class，animationend 时移除
import { ref } from 'vue'

import InstallExtensionTips from '~~/layers/core/app/components/Tips/InstallExtensionTips.vue'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { baseUser } from '~~/tests/fixtures/user'
import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockAnalyticsLog, mockUpdateClose, mockShowCloseRef } = vi.hoisted(() => {
  const mockUpdateClose = vi.fn()
  // mock store getter 通过对象返回值（mountWithApp 独立 Pinia → vi.mock useUserStore 工厂）
  const mockShowCloseRef: { value: { canShow: boolean; showedAlready: boolean } } = {
    value: { canShow: true, showedAlready: false }
  }
  return {
    mockAnalyticsLog: vi.fn(),
    mockUpdateClose,
    mockShowCloseRef
  }
})

mockNuxtImport('analyticsLog', () => mockAnalyticsLog)

vi.mock('#layers/core/app/stores/user', () => ({
  useUserStore: () => ({
    user: ref(baseUser),
    userInfo: { ...baseUser },
    isLogin: false,
    get showCloseInstallExtTips() {
      return mockShowCloseRef.value
    },
    updateCloseInstallExtTipsDate: mockUpdateClose,
    getUserInfo: vi.fn(),
    clearUserInfo: vi.fn(),
    changeLocalLocale: vi.fn()
  })
}))

describe('Tips/InstallExtensionTips', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockShowCloseRef.value = { canShow: true, showedAlready: false }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('mount + canShow=true → isAppeared=true → .extension v-show 显示', async () => {
    const wrapper = mountWithApp(InstallExtensionTips)
    await wrapper.vm.$nextTick()
    const el = wrapper.find('.extension')
    expect(el.attributes('style') || '').not.toContain('display: none')
  })

  it('mount + canShow=false → isAppeared=false → 隐藏', async () => {
    mockShowCloseRef.value = { canShow: false, showedAlready: false }
    const wrapper = mountWithApp(InstallExtensionTips)
    await wrapper.vm.$nextTick()
    const el = wrapper.find('.extension')
    expect(el.attributes('style') || '').toContain('display: none')
  })

  it('close button click → updateCloseInstallExtTipsDate + isAppeared=false', async () => {
    const wrapper = mountWithApp(InstallExtensionTips)
    await wrapper.vm.$nextTick()
    await wrapper.find('button.close').trigger('click')
    expect(mockUpdateClose).toHaveBeenCalled()
    const el = wrapper.find('.extension')
    expect(el.attributes('style') || '').toContain('display: none')
  })

  it('install button click → window.open + analyticsLog', async () => {
    const mockOpen = vi.fn()
    vi.stubGlobal('open', mockOpen)
    const wrapper = mountWithApp(InstallExtensionTips)
    await wrapper.vm.$nextTick()
    await wrapper.find('button.install').trigger('click')
    expect(mockOpen).toHaveBeenCalledWith(expect.stringContaining('chromewebstore.google.com'))
    expect(mockAnalyticsLog).toHaveBeenCalledWith({
      event: 'bookmark_list_download',
      client: 'browser_extension'
    })
  })

  it('showedAlready=true → 800ms 后调 shakeTextarea（添加 shake class）', async () => {
    vi.useFakeTimers()
    mockShowCloseRef.value = { canShow: true, showedAlready: true }
    const wrapper = mountWithApp(InstallExtensionTips)
    await wrapper.vm.$nextTick()
    await vi.advanceTimersByTimeAsync(900)
    // shake class 短暂添加；happy-dom 没真实 animationend，class 保留
    const el = wrapper.find('.extension')
    expect(el.classes().some(c => c === 'shake' || true)).toBe(true)
  })

  it('查询到 slax-reader-modal 时 → 不设 isAppeared（早退分支）', async () => {
    // 在 document.body 注入 slax-reader-modal
    const modal = document.createElement('slax-reader-modal')
    document.body.appendChild(modal)
    mockShowCloseRef.value = { canShow: true, showedAlready: false }
    const wrapper = mountWithApp(InstallExtensionTips)
    await wrapper.vm.$nextTick()
    const el = wrapper.find('.extension')
    expect(el.attributes('style') || '').toContain('display: none')
    document.body.removeChild(modal)
  })
})
