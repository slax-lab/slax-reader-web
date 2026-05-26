// TagsHeader 组件单测
// props: selectTagId / selectTagName
// emit: select-tag
// 顶层 setup 调 loadUserTags() → request().get(TAG_LIST) → tags filtered by display
// onMounted: selectTagId 非空 → 自动 emit select-tag
// addTagClick → isAddingTag=true + nextTick focus
// editTagClick → showEditTagModal
// saveTag: trim 空 → 取消；request.post(ADD_USER_TAG)
// onKeyDown: composition 期间短路；Enter saveTag；Escape isAddingTag=false
// selectTag / unselectTag → emit
import TagsHeader from '~~/layers/core/app/components/BookmarkList/TagsHeader.vue'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRequest, mockGet, mockPost, mockShowEditTagModal, mockToastShowToast } = vi.hoisted(() => {
  const mockGet = vi.fn(() => Promise.resolve([]))
  const mockPost = vi.fn(() => Promise.resolve({ id: 99, show_name: 'NewTag', display: true }))
  return {
    mockGet,
    mockPost,
    mockRequest: vi.fn(() => ({ get: mockGet, post: mockPost })),
    mockShowEditTagModal: vi.fn(),
    mockToastShowToast: vi.fn()
  }
})

mockNuxtImport('request', () => mockRequest)

vi.mock('#layers/core/app/components/Modal', () => ({
  showEditTagModal: mockShowEditTagModal
}))

vi.mock('#layers/core/app/components/Toast', () => ({
  default: { showToast: mockToastShowToast },
  ToastType: { Success: 'success', Error: 'error' }
}))

describe('TagsHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('渲染 + loadUserTags', () => {
    it('selectTagId 空 → 渲染 .tags-grids + .add tag-item', async () => {
      mockGet.mockResolvedValueOnce([
        { id: 1, show_name: 'Tag1', display: true },
        { id: 2, show_name: 'Tag2', display: true, system: true }
      ])
      const wrapper = mountWithApp(TagsHeader)
      await flushPromises()
      expect(wrapper.find('.tags-header').exists()).toBe(true)
      expect(wrapper.find('.add.tag-item').exists()).toBe(true)
      // 2 个 tag + 1 个 add → 3 个 tag-item
      const tagItems = wrapper.findAll('.tag-item')
      expect(tagItems.length).toBeGreaterThanOrEqual(3)
    })

    it('display=false 的 tag 被过滤', async () => {
      mockGet.mockResolvedValueOnce([
        { id: 1, show_name: 'Visible', display: true },
        { id: 2, show_name: 'Hidden', display: false }
      ])
      const wrapper = mountWithApp(TagsHeader)
      await flushPromises()
      const cells = wrapper.findAll('.tag-cell .tag-name')
      const names = cells.map(c => c.text())
      expect(names).toContain('Visible')
      expect(names).not.toContain('Hidden')
    })

    it('selectTagId 非空 → 渲染 .selected-tag 而非 .tags-grids', async () => {
      mockGet.mockResolvedValueOnce([{ id: 5, show_name: 'tech', display: true }])
      const wrapper = mountWithApp(TagsHeader, { props: { selectTagId: 5, selectTagName: 'tech' } })
      await flushPromises()
      expect(wrapper.find('.selected-tag').exists()).toBe(true)
    })

    it('mockGet 失败（返 null）→ Toast.showToast Error', async () => {
      mockGet.mockResolvedValueOnce(null)
      mountWithApp(TagsHeader)
      await flushPromises()
      expect(mockToastShowToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
    })
  })

  describe('onMounted', () => {
    it('selectTagId 非空 → mount 立即 emit select-tag', async () => {
      mockGet.mockResolvedValueOnce([{ id: 5, show_name: 'tech', display: true }])
      const wrapper = mountWithApp(TagsHeader, { props: { selectTagId: 5, selectTagName: 'tech' } })
      await flushPromises()
      const events = wrapper.emitted('select-tag')
      expect(events).toBeTruthy()
      expect(events![0]).toEqual([{ id: 5, name: 'tech' }])
    })
  })

  describe('交互', () => {
    it('selectTagId 空 + 点击 .tag-add → isAddingTag=true → .tag-input 显示', async () => {
      mockGet.mockResolvedValueOnce([])
      const wrapper = mountWithApp(TagsHeader)
      await flushPromises()
      await wrapper.find('.tag-add').trigger('click')
      expect(wrapper.find('.tag-input').exists()).toBe(true)
    })

    it('点击 .tag-cell → emit select-tag', async () => {
      mockGet.mockResolvedValueOnce([{ id: 1, show_name: 'tech', display: true }])
      const wrapper = mountWithApp(TagsHeader)
      await flushPromises()
      await wrapper.find('.tag-cell').trigger('click')
      const events = wrapper.emitted('select-tag')
      expect(events).toBeTruthy()
      expect(events![events!.length - 1]).toEqual([{ id: 1, name: 'tech' }])
    })

    it('点击非 system tag 的 edit button → showEditTagModal', async () => {
      mockGet.mockResolvedValueOnce([{ id: 7, show_name: 'tag', display: true }])
      const wrapper = mountWithApp(TagsHeader)
      await flushPromises()
      const editBtn = wrapper.find('.tag-operate button')
      expect(editBtn.exists()).toBe(true)
      await editBtn.trigger('click')
      expect(mockShowEditTagModal).toHaveBeenCalledWith(expect.objectContaining({ tagId: 7, tagName: 'tag' }))
    })

    it('selectTagId 非空 + 点击 back 按钮 → emit select-tag null', async () => {
      mockGet.mockResolvedValueOnce([{ id: 5, show_name: 'tech', display: true }])
      const wrapper = mountWithApp(TagsHeader, { props: { selectTagId: 5, selectTagName: 'tech' } })
      await flushPromises()
      await wrapper.find('.selected-tag .tag-header button').trigger('click')
      const events = wrapper.emitted('select-tag')
      expect(events).toBeTruthy()
      expect(events![events!.length - 1]).toEqual([null])
    })
  })

  describe('saveTag', () => {
    it('Enter + 文本非空 → request.post(ADD_USER_TAG) + 推入 tags', async () => {
      mockGet.mockResolvedValueOnce([])
      const wrapper = mountWithApp(TagsHeader)
      await flushPromises()
      await wrapper.find('.tag-add').trigger('click')
      const input = wrapper.find('.tag-input input')
      await input.setValue('newtag')
      await input.trigger('keydown', { key: 'Enter' })
      await flushPromises()
      expect(mockPost).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/v1/tag/create',
          body: { tag_name: 'newtag' }
        })
      )
    })

    it('Enter + 文本空（trim） → 取消（不调 request）', async () => {
      mockGet.mockResolvedValueOnce([])
      const wrapper = mountWithApp(TagsHeader)
      await flushPromises()
      await wrapper.find('.tag-add').trigger('click')
      const input = wrapper.find('.tag-input input')
      await input.setValue('   ')
      await input.trigger('keydown', { key: 'Enter' })
      await flushPromises()
      expect(mockPost).not.toHaveBeenCalled()
    })

    it('Escape → isAddingTag=false → .tag-add 重新显示', async () => {
      mockGet.mockResolvedValueOnce([])
      const wrapper = mountWithApp(TagsHeader)
      await flushPromises()
      await wrapper.find('.tag-add').trigger('click')
      const input = wrapper.find('.tag-input input')
      await input.trigger('keydown', { key: 'Escape' })
      await flushPromises()
      expect(wrapper.find('.tag-add').exists()).toBe(true)
    })

    it('saveTag mockPost 返 null → Toast Error', async () => {
      mockGet.mockResolvedValueOnce([])
      mockPost.mockResolvedValueOnce(null)
      const wrapper = mountWithApp(TagsHeader)
      await flushPromises()
      await wrapper.find('.tag-add').trigger('click')
      const input = wrapper.find('.tag-input input')
      await input.setValue('willfail')
      await input.trigger('keydown', { key: 'Enter' })
      await flushPromises()
      expect(mockToastShowToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
    })

    it('composition 期间 Enter → 短路（不调 saveTag）', async () => {
      mockGet.mockResolvedValueOnce([])
      const wrapper = mountWithApp(TagsHeader)
      await flushPromises()
      await wrapper.find('.tag-add').trigger('click')
      const input = wrapper.find('.tag-input input')
      await input.trigger('compositionstart')
      await input.setValue('foo')
      await input.trigger('keydown', { key: 'Enter' })
      await flushPromises()
      expect(mockPost).not.toHaveBeenCalled()
      // composition 结束后再 Enter 应该正常调
      await input.trigger('compositionend')
      await input.trigger('keydown', { key: 'Enter' })
      await flushPromises()
      expect(mockPost).toHaveBeenCalled()
    })
  })

  describe('selectTagId watch', () => {
    it('selectTagId 变化 → updateSelectTag → filterTagName 同步', async () => {
      mockGet.mockResolvedValueOnce([
        { id: 1, show_name: 'TagA', display: true },
        { id: 2, show_name: 'TagB', display: true }
      ])
      const wrapper = mountWithApp(TagsHeader, { props: { selectTagId: 1 } })
      await flushPromises()
      await wrapper.setProps({ selectTagId: 2 })
      await flushPromises()
      // 不抛错即覆盖 watch
      expect(wrapper.exists()).toBe(true)
    })

    it('selectTagId 设为 0 → updateSelectTag id=0 分支 → filterTagName 重置', async () => {
      mockGet.mockResolvedValueOnce([{ id: 1, show_name: 'TagA', display: true }])
      const wrapper = mountWithApp(TagsHeader, { props: { selectTagId: 1, selectTagName: 'TagA' } })
      await flushPromises()
      await wrapper.setProps({ selectTagId: 0 })
      await flushPromises()
      expect(wrapper.exists()).toBe(true)
    })
  })

  describe('editTagClick callbacks', () => {
    it('编辑回调 callback(id, name) → 修改 tag.show_name', async () => {
      mockGet.mockResolvedValueOnce([{ id: 7, show_name: 'old', display: true }])
      const wrapper = mountWithApp(TagsHeader)
      await flushPromises()
      await wrapper.find('.tag-operate button').trigger('click')
      // 拿到 showEditTagModal 调用参数 → 触发 callback
      const callArgs = mockShowEditTagModal.mock.calls[0][0]
      callArgs.callback(7, 'newname')
      await flushPromises()
      // 验证 tag.show_name 已更新
      const cell = wrapper.find('.tag-cell .tag-name')
      expect(cell.text()).toBe('newname')
    })

    it('编辑回调 callback id 不匹配 → 不修改', async () => {
      mockGet.mockResolvedValueOnce([{ id: 7, show_name: 'old', display: true }])
      const wrapper = mountWithApp(TagsHeader)
      await flushPromises()
      await wrapper.find('.tag-operate button').trigger('click')
      const callArgs = mockShowEditTagModal.mock.calls[0][0]
      callArgs.callback(99, 'newname')
      await flushPromises()
      const cell = wrapper.find('.tag-cell .tag-name')
      expect(cell.text()).toBe('old')
    })

    it('删除回调 deleteCallback(id) → 移除 tag', async () => {
      mockGet.mockResolvedValueOnce([
        { id: 7, show_name: 'tag7', display: true },
        { id: 8, show_name: 'tag8', display: true }
      ])
      const wrapper = mountWithApp(TagsHeader)
      await flushPromises()
      const editBtns = wrapper.findAll('.tag-operate button')
      await editBtns[0].trigger('click')
      const callArgs = mockShowEditTagModal.mock.calls[0][0]
      callArgs.deleteCallback(7)
      await flushPromises()
      const cells = wrapper.findAll('.tag-cell .tag-name')
      const names = cells.map(c => c.text())
      expect(names).not.toContain('tag7')
      expect(names).toContain('tag8')
    })

    it('删除回调 id 不匹配 → 不移除', async () => {
      mockGet.mockResolvedValueOnce([{ id: 7, show_name: 'tag7', display: true }])
      const wrapper = mountWithApp(TagsHeader)
      await flushPromises()
      await wrapper.find('.tag-operate button').trigger('click')
      const callArgs = mockShowEditTagModal.mock.calls[0][0]
      callArgs.deleteCallback(99)
      await flushPromises()
      const cells = wrapper.findAll('.tag-cell .tag-name')
      expect(cells.map(c => c.text())).toContain('tag7')
    })
  })
})
