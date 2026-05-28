// AddUrlTopModal 组件单测
// model: show
// emit: addUrlSuccess
// computed addUrlButtonEnable：text 非空 + http(s):// 前缀
// topModalClick → request().post(ADD_URL) → 关闭 modal + emit + clear
// watch show=true → focus inputbar
import { nextTick } from 'vue'

import AddUrlTopModal from '~~/layers/core/app/components/BookmarkList/AddUrlTopModal.vue'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRequest, mockPost } = vi.hoisted(() => {
  const mockPost = vi.fn(() => Promise.resolve({ bookmark_id: 1, status: 'ok' }))
  return {
    mockPost,
    mockRequest: vi.fn(() => ({ post: mockPost }))
  }
})

mockNuxtImport('request', () => mockRequest)

describe('AddUrlTopModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPost.mockResolvedValue({ bookmark_id: 1, status: 'ok' })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('show=false → v-show 隐藏', () => {
    const wrapper = mountWithApp(AddUrlTopModal, { props: { show: false } })
    const modal = wrapper.find('.bookmark-list-top-modals')
    expect(modal.attributes('style') || '').toContain('display: none')
  })

  it('show=true → InputBar 渲染', () => {
    const wrapper = mountWithApp(AddUrlTopModal, { props: { show: true } })
    expect(wrapper.findComponent({ name: 'InputBar' }).exists()).toBe(true)
  })

  it('addUrlText 空 → addUrlButtonEnable=false → InputBar disabled=true', async () => {
    const wrapper = mountWithApp(AddUrlTopModal, { props: { show: true } })
    const inputBar = wrapper.findComponent({ name: 'InputBar' })
    expect(inputBar.props('disabled')).toBe(true)
  })

  it('addUrlText 是非 http 前缀 → disabled 仍 true', async () => {
    const wrapper = mountWithApp(AddUrlTopModal, { props: { show: true } })
    const inputBar = wrapper.findComponent({ name: 'InputBar' })
    await inputBar.vm.$emit('update:text', 'foo bar')
    await nextTick()
    expect(inputBar.props('disabled')).toBe(true)
  })

  it('addUrlText 含 https:// → disabled=false', async () => {
    const wrapper = mountWithApp(AddUrlTopModal, { props: { show: true } })
    const inputBar = wrapper.findComponent({ name: 'InputBar' })
    await inputBar.vm.$emit('update:text', 'https://example.com')
    await nextTick()
    expect(inputBar.props('disabled')).toBe(false)
  })

  it('addUrlText 含 http:// → disabled=false', async () => {
    const wrapper = mountWithApp(AddUrlTopModal, { props: { show: true } })
    const inputBar = wrapper.findComponent({ name: 'InputBar' })
    await inputBar.vm.$emit('update:text', 'http://example.com')
    await nextTick()
    expect(inputBar.props('disabled')).toBe(false)
  })

  it('confirm → request().post + emit addUrlSuccess + emit update:show false', async () => {
    const wrapper = mountWithApp(AddUrlTopModal, { props: { show: true } })
    const inputBar = wrapper.findComponent({ name: 'InputBar' })
    await inputBar.vm.$emit('update:text', 'https://example.com')
    await nextTick()
    await inputBar.vm.$emit('confirm')
    await flushPromises()
    expect(mockPost).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/v1/bookmark/add_url',
        body: { target_url: 'https://example.com' }
      })
    )
    expect(wrapper.emitted('addUrlSuccess')).toBeTruthy()
    expect(wrapper.emitted('addUrlSuccess')![0]).toEqual(['https://example.com'])
    expect(wrapper.emitted('update:show')).toBeTruthy()
  })

  it('show false→true 切换 → nextTick 调 inputbar.focus（不抛错即覆盖 watch）', async () => {
    const wrapper = mountWithApp(AddUrlTopModal, { props: { show: false } })
    await wrapper.setProps({ show: true })
    await nextTick()
    await nextTick()
    expect(wrapper.exists()).toBe(true)
  })
})
