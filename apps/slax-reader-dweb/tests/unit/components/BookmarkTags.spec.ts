// components/BookmarkTags.vue 单测 —— 第四期 Sprint A.2.2
// 覆盖：tags 渲染（readonly toggling）/ deleteBookmarkTag 调 request.post 删除并 splice /
//      addingTagClick 切换 isAddingTag / 打开后调 searchingTags 拉 TAG_LIST 列表 /
//      searchResultTags 过滤已选 + 名称匹配 / searchTagClick 调 ADD_BOOKMARK_TAG /
//      onKeyDown Enter：已存在同名跳过 / 命中 search → addBookmarkTag(tagId) / 未命中 → addBookmarkTag(tagName) /
//      bookmarkId 缺失：addBookmarkTag/deleteBookmarkTag 短路
// 关键约束：v-show 包在 <Transition> 内，happy-dom 不真触发 transition，wrapper.find('.search-list').isVisible()
//          离开态仍 truthy；统一通过断言 inline style.display 来验证关闭态
import BookmarkTags from '~~/layers/core/app/components/BookmarkTags.vue'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGet, mockPost, mockRequest } = vi.hoisted(() => {
  const get = vi.fn()
  const post = vi.fn()
  return {
    mockGet: get,
    mockPost: post,
    mockRequest: vi.fn(() => ({ get, post }))
  }
})

mockNuxtImport('request', () => mockRequest)

const baseTags = [
  { id: 1, show_name: 'tech', system: false },
  { id: 2, show_name: 'ai', system: true }
]

function isPanelHidden(wrapper: ReturnType<typeof mountWithApp>): boolean {
  const el = wrapper.find('.search-list').element as HTMLElement
  return el.style.display === 'none'
}

beforeEach(() => {
  mockGet.mockReset()
  mockPost.mockReset()
  mockGet.mockResolvedValue([
    { id: 1, show_name: 'tech', system: false },
    { id: 2, show_name: 'ai', system: true },
    { id: 3, show_name: 'design', system: false },
    { id: 4, show_name: 'ai-tools', system: true }
  ])
  mockPost.mockResolvedValue({ id: 99, show_name: 'new-tag', system: false })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('components/BookmarkTags', () => {
  describe('渲染', () => {
    it('readonly=false：每个 tag 渲染删除按钮 + 顶部 add 按钮', () => {
      const wrapper = mountWithApp(BookmarkTags, { props: { tags: baseTags, bookmarkId: 7 } })
      expect(wrapper.findAll('.tag')).toHaveLength(2)
      expect(wrapper.findAll('.tag button')).toHaveLength(2)
      expect(wrapper.find('.operate .add').exists()).toBe(true)
    })

    it('readonly=true：tag 内不渲染删除按钮 + 不渲染 add 按钮', () => {
      const wrapper = mountWithApp(BookmarkTags, { props: { tags: baseTags, readonly: true } })
      expect(wrapper.findAll('.tag')).toHaveLength(2)
      expect(wrapper.findAll('.tag button')).toHaveLength(0)
      expect(wrapper.find('.operate').exists()).toBe(false)
    })

    it('props.tags 变化：watch 同步 bookmarkTags', async () => {
      const wrapper = mountWithApp(BookmarkTags, { props: { tags: [...baseTags], bookmarkId: 7 } })
      await wrapper.setProps({ tags: [{ id: 9, show_name: 'newone', system: false }] })
      expect(wrapper.findAll('.tag')).toHaveLength(1)
      expect(wrapper.find('.tag span').text()).toBe('newone')
    })
  })

  describe('删除标签', () => {
    it('deleteBookmarkTag：调 request.post + splice 列表', async () => {
      const wrapper = mountWithApp(BookmarkTags, { props: { tags: [...baseTags], bookmarkId: 7 } })
      await wrapper.findAll('.tag button')[0]!.trigger('click')
      expect(mockPost).toHaveBeenCalledTimes(1)
      const call = mockPost.mock.calls[0]![0] as { url: string; body: { bookmark_id: number; tag_id: number } }
      expect(call.url).toBe('/v1/bookmark/del_tag')
      expect(call.body).toEqual({ bookmark_id: 7, tag_id: 1 })
      await flushPromises()
      expect(wrapper.findAll('.tag')).toHaveLength(1)
    })

    it('deleteBookmarkTag：bookmarkId 缺失短路不调 post', async () => {
      const wrapper = mountWithApp(BookmarkTags, { props: { tags: [...baseTags] } })
      await wrapper.findAll('.tag button')[0]!.trigger('click')
      expect(mockPost).not.toHaveBeenCalled()
      expect(wrapper.findAll('.tag')).toHaveLength(2)
    })
  })

  describe('打开搜索面板 + searchingTags', () => {
    it('点击 add：isAddingTag=true，调 request.get 拉 TAG_LIST', async () => {
      const wrapper = mountWithApp(BookmarkTags, { props: { tags: [...baseTags], bookmarkId: 7 } })
      await wrapper.find('.operate .add').trigger('click')
      await flushPromises()
      expect(mockGet).toHaveBeenCalledTimes(1)
      expect(mockGet.mock.calls[0]![0]).toEqual({ url: '/v1/tag/list' })
    })

    it('searchResultTags：默认过滤已绑定的 tag，仅展示新增候选', async () => {
      const wrapper = mountWithApp(BookmarkTags, { props: { tags: [...baseTags], bookmarkId: 7 } })
      await wrapper.find('.operate .add').trigger('click')
      await flushPromises()
      const tags = wrapper.findAll('.search-tag')
      // baseTags 含 1/2，过滤后剩 3/4
      expect(tags).toHaveLength(2)
      const names = tags.map(t => t.find('span').text())
      expect(names).toEqual(['design', 'ai-tools'])
    })

    it('searchResultTags：searchText 进一步过滤名称包含 ai 的候选', async () => {
      const wrapper = mountWithApp(BookmarkTags, { props: { tags: [...baseTags], bookmarkId: 7 } })
      await wrapper.find('.operate .add').trigger('click')
      await flushPromises()
      const input = wrapper.find('input')
      await input.setValue('ai')
      const tags = wrapper.findAll('.search-tag')
      expect(tags).toHaveLength(1)
      expect(tags[0]!.find('span').text()).toBe('ai-tools')
    })

    it('isAddingLoading：searchingTags 调用中再次触发返回早返', async () => {
      let resolveGet: (v: unknown) => void = () => {}
      mockGet.mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveGet = resolve
          })
      )
      const wrapper = mountWithApp(BookmarkTags, { props: { tags: [...baseTags], bookmarkId: 7 } })
      await wrapper.find('.operate .add').trigger('click')
      await wrapper.find('.operate .add').trigger('click')
      // 第二次切回 false 但 isAddingLoading 仍 true
      expect(mockGet).toHaveBeenCalledTimes(1)
      resolveGet([])
      await flushPromises()
    })
  })

  describe('addBookmarkTag', () => {
    async function openPanel() {
      const wrapper = mountWithApp(BookmarkTags, { props: { tags: [...baseTags], bookmarkId: 7 } })
      await wrapper.find('.operate .add').trigger('click')
      await flushPromises()
      return wrapper
    }

    it('searchTagClick：调 request.post ADD_BOOKMARK_TAG，使用 tagId', async () => {
      const wrapper = await openPanel()
      mockPost.mockResolvedValueOnce({ id: 3, show_name: 'design', system: false })
      await wrapper.findAll('.search-tag')[0]!.trigger('click')
      await flushPromises()
      const call = mockPost.mock.calls[0]![0] as { url: string; body: { bookmark_id: number; tag_id?: number; tag_name?: string } }
      expect(call.url).toBe('/v1/bookmark/add_tag')
      expect(call.body).toEqual({ bookmark_id: 7, tag_id: 3, tag_name: undefined })
    })

    it('searchTagClick 成功：列表 push 新 tag + 关闭 panel', async () => {
      const wrapper = await openPanel()
      mockPost.mockResolvedValueOnce({ id: 3, show_name: 'design', system: false })
      await wrapper.findAll('.search-tag')[0]!.trigger('click')
      await flushPromises()
      expect(wrapper.findAll('.tag')).toHaveLength(3)
      expect(isPanelHidden(wrapper)).toBe(true)
    })

    it('addBookmarkTag：bookmarkId 缺失早返不调 post', async () => {
      const wrapper = mountWithApp(BookmarkTags, { props: { tags: [...baseTags] } })
      // 没有 add 按钮（readonly false 但 bookmarkId 缺失下 add 仍渲染）；强制打开 panel：
      await wrapper.find('.operate .add').trigger('click')
      await flushPromises()
      // 因 mockGet 给 4 项，过滤后还剩 design/ai-tools 2 项
      expect(wrapper.findAll('.search-tag').length).toBeGreaterThan(0)
      mockPost.mockClear()
      await wrapper.findAll('.search-tag')[0]!.trigger('click')
      await flushPromises()
      expect(mockPost).not.toHaveBeenCalled()
    })
  })

  describe('Enter 键提交', () => {
    async function openPanel() {
      const wrapper = mountWithApp(BookmarkTags, { props: { tags: [...baseTags], bookmarkId: 7 } })
      await wrapper.find('.operate .add').trigger('click')
      await flushPromises()
      return wrapper
    }

    it('搜索文本是已绑定的 tag 名：直接关闭 panel 不调 post', async () => {
      const wrapper = await openPanel()
      const input = wrapper.find('input')
      await input.setValue('tech')
      mockPost.mockClear()
      await input.trigger('keydown', { key: 'Enter' })
      await flushPromises()
      expect(mockPost).not.toHaveBeenCalled()
      expect(isPanelHidden(wrapper)).toBe(true)
    })

    it('搜索文本命中 search 列表：调 ADD_BOOKMARK_TAG with tagId', async () => {
      const wrapper = await openPanel()
      const input = wrapper.find('input')
      await input.setValue('design')
      await input.trigger('keydown', { key: 'Enter' })
      await flushPromises()
      const call = mockPost.mock.calls[0]![0] as { url: string; body: { bookmark_id: number; tag_id?: number; tag_name?: string } }
      expect(call.url).toBe('/v1/bookmark/add_tag')
      expect(call.body.tag_id).toBe(3)
    })

    it('搜索文本未命中：调 ADD_BOOKMARK_TAG with tagName', async () => {
      const wrapper = await openPanel()
      const input = wrapper.find('input')
      await input.setValue('brand-new-tag')
      await input.trigger('keydown', { key: 'Enter' })
      await flushPromises()
      const call = mockPost.mock.calls[0]![0] as { url: string; body: { bookmark_id: number; tag_id?: number; tag_name?: string } }
      expect(call.body.tag_id).toBeUndefined()
      expect(call.body.tag_name).toBe('brand-new-tag')
    })

    it('isAddingTag=false 时：onKeyDown 早返不调 post', async () => {
      const wrapper = await openPanel()
      const input = wrapper.find('input')
      await input.setValue('design')
      // 关闭 panel（v-on-click-outside 在测试里难触发，改 stopPropagation）
      await wrapper.find('.operate .add').trigger('click')
      await flushPromises()
      mockPost.mockClear()
      await input.trigger('keydown', { key: 'Enter' })
      await flushPromises()
      expect(mockPost).not.toHaveBeenCalled()
    })
  })

  describe('addingTagClick stopPropagation', () => {
    it('多次点击切换 isAddingTag', async () => {
      const wrapper = mountWithApp(BookmarkTags, { props: { tags: [...baseTags], bookmarkId: 7 } })
      await wrapper.find('.operate .add').trigger('click')
      await flushPromises()
      expect(isPanelHidden(wrapper)).toBe(false)
      await wrapper.find('.operate .add').trigger('click')
      await flushPromises()
      expect(isPanelHidden(wrapper)).toBe(true)
    })
  })
})
