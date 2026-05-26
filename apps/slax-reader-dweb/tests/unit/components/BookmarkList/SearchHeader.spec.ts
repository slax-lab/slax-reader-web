// SearchHeader 组件单测
// props: defaultSearchText
// emit: back / searchStatusUpdate
// 依赖 request().post (auto-import) + pwaOpen (auto-import)
// onMounted 调 search 一次（依赖 defaultSearchText 非空）
// watch defaultSearchText / isSearching
import { nextTick } from 'vue'

import SearchHeader from '~~/layers/core/app/components/BookmarkList/SearchHeader.vue'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRequest, mockPost, mockPwaOpen } = vi.hoisted(() => {
  const mockPost = vi.fn(() => Promise.resolve([]))
  return {
    mockPost,
    mockRequest: vi.fn(() => ({ post: mockPost })),
    mockPwaOpen: vi.fn()
  }
})

mockNuxtImport('request', () => mockRequest)
mockNuxtImport('pwaOpen', () => mockPwaOpen)

describe('SearchHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPost.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('渲染 + onMounted', () => {
    it('默认渲染 .search-header + .search-navigator + InputBar', () => {
      const wrapper = mountWithApp(SearchHeader)
      expect(wrapper.find('.search-header').exists()).toBe(true)
      expect(wrapper.find('.search-navigator').exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'InputBar' }).exists()).toBe(true)
    })

    it('defaultSearchText 非空 → onMounted 触发 search → mockPost 调', async () => {
      mountWithApp(SearchHeader, { props: { defaultSearchText: 'foo' } })
      await flushPromises()
      expect(mockPost).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/v1/bookmark/search',
          body: { keyword: 'foo' }
        })
      )
    })

    it('defaultSearchText 空 → search 短路 → mockPost 不调', async () => {
      mountWithApp(SearchHeader, { props: { defaultSearchText: '' } })
      await flushPromises()
      expect(mockPost).not.toHaveBeenCalled()
    })

    it('search 返结果 → 渲染 .search-cell', async () => {
      mockPost.mockResolvedValueOnce([
        { bookmark_id: 1, highlight_title: '<mark>foo</mark>', highlight_content: 'content', type: 'fts', vs_score: 0 },
        { bookmark_id: 2, highlight_title: '<mark>foo</mark>2', highlight_content: 'content2', type: 'vector', vs_score: 0.85 }
      ])
      const wrapper = mountWithApp(SearchHeader, { props: { defaultSearchText: 'foo' } })
      await flushPromises()
      expect(wrapper.findAll('.search-cell').length).toBe(2)
    })

    it('vector 类型 → 渲染 semantic_relative 文案', async () => {
      mockPost.mockResolvedValueOnce([{ bookmark_id: 1, highlight_title: 't', highlight_content: 'c', type: 'vector', vs_score: 0.85 }])
      const wrapper = mountWithApp(SearchHeader, { props: { defaultSearchText: 'foo' } })
      await flushPromises()
      const aiTag = wrapper.find('.cell-header-ai-tag span')
      expect(aiTag.exists()).toBe(true)
    })

    it('isSearching=false + 0 results → 渲染 .no-data', async () => {
      mockPost.mockResolvedValueOnce([])
      const wrapper = mountWithApp(SearchHeader, { props: { defaultSearchText: 'foo' } })
      await flushPromises()
      expect(wrapper.find('.no-data').exists()).toBe(true)
    })
  })

  describe('交互', () => {
    it('back 按钮 click → emit back + searchStatusUpdate(false)', async () => {
      const wrapper = mountWithApp(SearchHeader)
      await wrapper.find('.search-navigator button').trigger('click')
      expect(wrapper.emitted('back')).toBeTruthy()
      expect(wrapper.emitted('searchStatusUpdate')).toBeTruthy()
      const statusEvents = wrapper.emitted('searchStatusUpdate')!
      expect(statusEvents[statusEvents.length - 1]).toEqual([false])
    })

    it('cell-header-title click → pwaOpen({ url: /bookmarks/${id} })', async () => {
      mockPost.mockResolvedValueOnce([{ bookmark_id: 42, highlight_title: 't', highlight_content: 'c', type: 'fts', vs_score: 0 }])
      const wrapper = mountWithApp(SearchHeader, { props: { defaultSearchText: 'foo' } })
      await flushPromises()
      const title = wrapper.find('.cell-header-title')
      expect(title.exists()).toBe(true)
      await title.trigger('click')
      expect(mockPwaOpen).toHaveBeenCalledWith({ url: '/bookmarks/42' })
    })

    it('InputBar emit confirm → search 调 → mockPost', async () => {
      const wrapper = mountWithApp(SearchHeader)
      const inputBar = wrapper.findComponent({ name: 'InputBar' })
      await inputBar.vm.$emit('update:text', 'bar')
      await nextTick()
      await inputBar.vm.$emit('confirm')
      await flushPromises()
      expect(mockPost).toHaveBeenCalledWith(expect.objectContaining({ body: { keyword: 'bar' } }))
    })
  })

  describe('watch 行为', () => {
    it('defaultSearchText 变化 → 重新搜索', async () => {
      const wrapper = mountWithApp(SearchHeader, { props: { defaultSearchText: 'foo' } })
      await flushPromises()
      mockPost.mockClear()
      await wrapper.setProps({ defaultSearchText: 'bar' })
      await flushPromises()
      expect(mockPost).toHaveBeenCalledWith(expect.objectContaining({ body: { keyword: 'bar' } }))
    })

    it('isSearching 变化 → emit searchStatusUpdate', async () => {
      const wrapper = mountWithApp(SearchHeader, { props: { defaultSearchText: 'foo' } })
      await flushPromises()
      const events = wrapper.emitted('searchStatusUpdate')
      // search 进入 isSearching=true → 然后 false，应该至少 emit 2 次
      expect(events).toBeTruthy()
      expect(events!.length).toBeGreaterThanOrEqual(2)
    })

    it('搜索抛错 → console.error + isSearching 走完', async () => {
      mockPost.mockRejectedValueOnce(new Error('network'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const wrapper = mountWithApp(SearchHeader, { props: { defaultSearchText: 'foo' } })
      await flushPromises()
      expect(consoleSpy).toHaveBeenCalled()
      // .no-data 因 isSearching=false + searchResults=[] 渲染
      expect(wrapper.find('.no-data').exists()).toBe(true)
      consoleSpy.mockRestore()
    })
  })
})
