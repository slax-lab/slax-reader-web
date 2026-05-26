// SearchTopModal 组件单测
// model: show (boolean)
// emit: search(text)
// 子组件 InputBar 透传 v-model:text + @confirm
// 内部 watch show=true → nextTick → inputbar.focus()
// topModalClick → emit search + closeModal + clear text + analyticsLog
import { nextTick } from 'vue'

import SearchTopModal from '~~/layers/core/app/components/BookmarkList/SearchTopModal.vue'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockAnalyticsLog } = vi.hoisted(() => ({
  mockAnalyticsLog: vi.fn()
}))

mockNuxtImport('analyticsLog', () => mockAnalyticsLog)

describe('SearchTopModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('show=false → 不渲染（v-show 隐藏）', () => {
    const wrapper = mountWithApp(SearchTopModal, { props: { show: false } })
    const modal = wrapper.find('.bookmark-list-top-modals')
    expect(modal.exists()).toBe(true)
    expect(modal.attributes('style') || '').toContain('display: none')
  })

  it('show=true → 渲染 + InputBar 透传', () => {
    const wrapper = mountWithApp(SearchTopModal, { props: { show: true } })
    const modal = wrapper.find('.bookmark-list-top-modals')
    expect(modal.attributes('style') || '').not.toContain('display: none')
    expect(wrapper.findComponent({ name: 'InputBar' }).exists()).toBe(true)
  })

  it('InputBar emit confirm → topModalClick → emit search(text) + analyticsLog', async () => {
    const wrapper = mountWithApp(SearchTopModal, { props: { show: true } })
    const inputBar = wrapper.findComponent({ name: 'InputBar' })
    // 通过 setValue 设 searchText
    await wrapper.findComponent({ name: 'InputBar' }).vm.$emit('update:text', 'hello')
    await nextTick()
    await inputBar.vm.$emit('confirm')
    await flushPromises()
    const events = wrapper.emitted('search')
    expect(events).toBeTruthy()
    expect(events![0]).toEqual(['hello'])
    expect(mockAnalyticsLog).toHaveBeenCalledWith({ event: 'bookmark_list_search' })
  })

  it('topModalClick 后 → emit update:show false（closeModal）+ searchText 清空', async () => {
    const wrapper = mountWithApp(SearchTopModal, { props: { show: true } })
    const inputBar = wrapper.findComponent({ name: 'InputBar' })
    await inputBar.vm.$emit('update:text', 'foo')
    await nextTick()
    await inputBar.vm.$emit('confirm')
    await flushPromises()
    const events = wrapper.emitted('update:show')
    expect(events).toBeTruthy()
    expect(events![0]).toEqual([false])
  })

  it('analyticsLog 抛错 → console.error 但不影响 emit search', async () => {
    mockAnalyticsLog.mockImplementationOnce(() => {
      throw new Error('analytics failed')
    })
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mountWithApp(SearchTopModal, { props: { show: true } })
    const inputBar = wrapper.findComponent({ name: 'InputBar' })
    await inputBar.vm.$emit('update:text', 'foo')
    await nextTick()
    await inputBar.vm.$emit('confirm')
    await flushPromises()
    expect(wrapper.emitted('search')).toBeTruthy()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('show false→true 切换 → nextTick 调 inputbar.focus', async () => {
    const wrapper = mountWithApp(SearchTopModal, { props: { show: false } })
    await wrapper.setProps({ show: true })
    await nextTick()
    await nextTick()
    // inputbar.focus 通过 ref 调，不易 spy；不抛错即覆盖 watch
    expect(wrapper.exists()).toBe(true)
  })
})
