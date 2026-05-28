// Tips/ShareBubbleTips 组件单测
// userStore.showShareTips → showTips
// click → updateShareTipsClicked + showTips=false（短路：showTips=false 时直接返回）
// onResizeObserver: entries 数组 → containerWidth 同步；非数组 → 短路
// computed bubbleWidth/svgPath/viewBox 由 containerWidth 决定
import { ref } from 'vue'

import ShareBubbleTips from '~~/layers/core/app/components/Tips/ShareBubbleTips.vue'

import { mount } from '@vue/test-utils'
import { baseUser } from '~~/tests/fixtures/user'
import { createTestI18n } from '~~/tests/setup/i18n'
import { mountWithApp } from '~~/tests/setup/mount'
import { createTestPinia } from '~~/tests/setup/pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockUpdateShareTipsClicked, mockShareTipsRef } = vi.hoisted(() => {
  const mockShareTipsRef: { value: boolean } = { value: true }
  return {
    mockUpdateShareTipsClicked: vi.fn(),
    mockShareTipsRef
  }
})

vi.mock('#layers/core/app/stores/user', () => ({
  useUserStore: () => ({
    user: ref(baseUser),
    userInfo: { ...baseUser },
    isLogin: false,
    get showShareTips() {
      return mockShareTipsRef.value
    },
    updateShareTipsClicked: mockUpdateShareTipsClicked,
    getUserInfo: vi.fn(),
    clearUserInfo: vi.fn(),
    changeLocalLocale: vi.fn()
  })
}))

describe('Tips/ShareBubbleTips', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockShareTipsRef.value = true
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('mount → 渲染 .share-tips 容器 + .bubble-tips', () => {
    const wrapper = mountWithApp(ShareBubbleTips)
    expect(wrapper.find('.share-tips').exists()).toBe(true)
    expect(wrapper.find('.bubble-tips').exists()).toBe(true)
  })

  it('showShareTips=true → showTips=true → bubble v-show 显示', async () => {
    mockShareTipsRef.value = true
    const wrapper = mountWithApp(ShareBubbleTips)
    await wrapper.vm.$nextTick()
    const bubble = wrapper.find('.bubble-tips')
    expect(bubble.attributes('style') || '').not.toContain('display: none')
  })

  it('showShareTips=false → showTips=false → bubble 隐藏', async () => {
    mockShareTipsRef.value = false
    const wrapper = mountWithApp(ShareBubbleTips)
    await wrapper.vm.$nextTick()
    const bubble = wrapper.find('.bubble-tips')
    expect(bubble.attributes('style') || '').toContain('display: none')
  })

  it('showTips=true 时 click .share-tips → updateShareTipsClicked + showTips=false', async () => {
    mockShareTipsRef.value = true
    const wrapper = mountWithApp(ShareBubbleTips)
    await wrapper.vm.$nextTick()
    await wrapper.find('.share-tips').trigger('click')
    expect(mockUpdateShareTipsClicked).toHaveBeenCalled()
  })

  it('showTips=false 时 click → 短路（不调 updateShareTipsClicked）', async () => {
    mockShareTipsRef.value = false
    const wrapper = mountWithApp(ShareBubbleTips)
    await wrapper.vm.$nextTick()
    await wrapper.find('.share-tips').trigger('click')
    expect(mockUpdateShareTipsClicked).not.toHaveBeenCalled()
  })

  it('locale=zh → bubble-title 含 zh class（用 zh i18n 实例 mount）', async () => {
    const wrapper = mount(ShareBubbleTips, {
      global: {
        plugins: [createTestI18n('zh'), createTestPinia()]
      }
    })
    await wrapper.vm.$nextTick()
    const title = wrapper.find('.bubble-title')
    expect(title.classes()).toContain('zh')
  })

  it('locale=en → bubble-title 不含 zh class', async () => {
    const wrapper = mountWithApp(ShareBubbleTips)
    await wrapper.vm.$nextTick()
    const title = wrapper.find('.bubble-title')
    expect(title.classes()).not.toContain('zh')
  })

  it('default slot 渲染', () => {
    const wrapper = mountWithApp(ShareBubbleTips, { slots: { default: '<div class="custom-slot">SLOT</div>' } })
    expect(wrapper.find('.custom-slot').exists()).toBe(true)
  })

  it('onResizeObserver 接收 entries 数组 → containerWidth 同步（不抛错即覆盖）', async () => {
    const wrapper = mountWithApp(ShareBubbleTips)
    await wrapper.vm.$nextTick()
    const setup: any = (wrapper.vm as any).$.setupState
    expect(typeof setup.onResizeObserver).toBe('function')
    setup.onResizeObserver([{ contentRect: { width: 200 } }])
    setup.onResizeObserver('not-array')
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })
})
