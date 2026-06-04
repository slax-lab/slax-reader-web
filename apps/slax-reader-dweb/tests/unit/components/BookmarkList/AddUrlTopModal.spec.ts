// AddUrlTopModal 组件单测（居中 modal 版本，使用 Teleport to="body"）
// model: show
// emit: addUrlSuccess
// computed addUrlButtonEnable：text 非空 + http(s):// 前缀
// topModalClick → request().post(ADD_URL) → 关闭 modal + emit + clear
// watch show=true → focus input
// 注意：Teleport 渲染到 document.body，需 attachTo: document.body 并从 document 查找
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

// Teleport 渲染到 body，需要 attachTo 才能在 document 中找到元素
const mountModal = (show: boolean) =>
  mountWithApp(AddUrlTopModal, {
    props: { show },
    attachTo: document.body
  })

describe('AddUrlTopModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPost.mockResolvedValue({ bookmark_id: 1, status: 'ok' })
  })

  afterEach(() => {
    vi.useRealTimers()
    // 清理 Teleport 挂载到 body 的内容
    document.body.innerHTML = ''
  })

  it('show=false → modal-backdrop 不渲染', () => {
    mountModal(false)
    expect(document.querySelector('.modal-backdrop')).toBeNull()
  })

  it('show=true → modal-dialog 渲染', () => {
    mountModal(true)
    expect(document.querySelector('.modal-dialog')).not.toBeNull()
  })

  it('addUrlText 空 → 提交按钮 disabled', async () => {
    mountModal(true)
    await nextTick()
    const btn = document.querySelector('.modal-btn-primary') as HTMLButtonElement
    expect(btn?.disabled).toBe(true)
  })

  it('addUrlText 是非 http 前缀 → 提交按钮仍 disabled', async () => {
    mountModal(true)
    await nextTick()
    const input = document.querySelector('.modal-input') as HTMLInputElement
    input.value = 'foo bar'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    const btn = document.querySelector('.modal-btn-primary') as HTMLButtonElement
    expect(btn?.disabled).toBe(true)
  })

  it('addUrlText 含 https:// → 提交按钮 enabled', async () => {
    mountModal(true)
    await nextTick()
    const input = document.querySelector('.modal-input') as HTMLInputElement
    input.value = 'https://example.com'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    const btn = document.querySelector('.modal-btn-primary') as HTMLButtonElement
    expect(btn?.disabled).toBe(false)
  })

  it('addUrlText 含 http:// → 提交按钮 enabled', async () => {
    mountModal(true)
    await nextTick()
    const input = document.querySelector('.modal-input') as HTMLInputElement
    input.value = 'http://example.com'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    const btn = document.querySelector('.modal-btn-primary') as HTMLButtonElement
    expect(btn?.disabled).toBe(false)
  })

  it('confirm → request().post + emit addUrlSuccess + emit update:show false', async () => {
    const wrapper = mountModal(true)
    await nextTick()
    const input = document.querySelector('.modal-input') as HTMLInputElement
    input.value = 'https://example.com'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    const btn = document.querySelector('.modal-btn-primary') as HTMLButtonElement
    btn.click()
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

  it('show false→true 切换 → 不抛错（watch focus 覆盖）', async () => {
    const wrapper = mountModal(false)
    await wrapper.setProps({ show: true })
    await nextTick()
    await nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('关闭按钮 click → emit update:show false', async () => {
    const wrapper = mountModal(true)
    await nextTick()
    const closeBtn = document.querySelector('.modal-close') as HTMLButtonElement
    closeBtn.click()
    await nextTick()
    expect(wrapper.emitted('update:show')).toBeTruthy()
  })
})
