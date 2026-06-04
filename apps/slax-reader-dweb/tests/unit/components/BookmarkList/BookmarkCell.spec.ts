// components/BookmarkList/BookmarkCell.vue 单测（Phase 4 卡片化重设计后更新）
// 新结构：.article-card、.article-title、.article-star、.article-action、.article-date、.article-source
import { reactive } from 'vue'

import BookmarkCell from '~~/layers/core/app/components/BookmarkList/BookmarkCell.vue'

import { BookmarkParseStatus } from '@commons/types/interface'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { baseBookmarkItem, makeBookmarkItem } from '~~/tests/fixtures/bookmark'
import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGet, mockPost, mockRequest, mockPwaOpen, mockAnalyticsLog, mockToastShowToast, mockShowSnapshot, mockUseRoute, mockRoute } = vi.hoisted(() => {
  const get = vi.fn()
  const post = vi.fn()
  const route = { query: {}, params: {}, path: '/bookmarks', fullPath: '/bookmarks' } as Record<string, unknown>
  return {
    mockGet: get,
    mockPost: post,
    mockRequest: vi.fn(() => ({ get, post })),
    mockPwaOpen: vi.fn(),
    mockAnalyticsLog: vi.fn(),
    mockToastShowToast: vi.fn(),
    mockShowSnapshot: vi.fn(),
    mockUseRoute: vi.fn(() => route),
    mockRoute: route
  }
})

vi.mock('#layers/core/app/components/Toast', () => ({
  default: { showToast: mockToastShowToast },
  ToastType: { Success: 1, Error: 2, Warning: 3, Info: 4 }
}))

vi.mock('#layers/core/app/components/Modal', () => ({
  showSnapshotStatusModal: mockShowSnapshot
}))

mockNuxtImport('request', () => mockRequest)
mockNuxtImport('pwaOpen', () => mockPwaOpen)
mockNuxtImport('analyticsLog', () => mockAnalyticsLog)
mockNuxtImport('useRoute', () => mockUseRoute)

beforeEach(() => {
  mockGet.mockReset()
  mockPost.mockReset()
  mockPwaOpen.mockClear()
  mockAnalyticsLog.mockClear()
  mockToastShowToast.mockClear()
  mockShowSnapshot.mockClear()
  mockPost.mockResolvedValue({ ok: true, bookmark_id: 1, status: 'inbox' })
  mockRoute.query = {}
  // 清除 localStorage 影响 reminderKey
  localStorage.clear()
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('components/BookmarkList/BookmarkCell', () => {
  describe('渲染 + computed', () => {
    it('渲染标题 / 站点名 / 日期 + 操作按钮（普通文章 / 非 trashed / 非 subscribe）', () => {
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: false, index: 0 }
      })
      expect(wrapper.find('.article-title').text()).toBe(baseBookmarkItem.title)
      expect(wrapper.find('.article-source').text()).toBe('Example Site')
      expect(wrapper.find('.article-date').text()).toBe('2026-01-01')
      // 操作按钮：编辑 + 归档 + 删除 = 3 个
      expect(wrapper.findAll('.article-action').length).toBe(3)
    })

    it('alias_title 优先于 title 渲染', () => {
      const bm = makeBookmarkItem({ alias_title: '别名标题' })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      expect(wrapper.find('.article-title').text()).toBe('别名标题')
    })

    it('isStarred=true（starred=star）：star 按钮带 active class', () => {
      const bm = makeBookmarkItem({ starred: 'star' })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      expect(wrapper.find('.article-star').classes()).toContain('active')
    })

    it('isTrashed=true：渲染恢复按钮 + 不渲染删除按钮', () => {
      const bm = makeBookmarkItem({ trashed_at: '2026-01-02T00:00:00.000Z' })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      // isTrashed=true：[0]=编辑, [1]=恢复，无 danger 按钮
      expect(wrapper.findAll('.article-action').length).toBe(2)
      expect(wrapper.find('.article-action.danger').exists()).toBe(false)
      expect(wrapper.find('.article-date').text()).toBe('2026-01-02')
    })

    it('shortcut 类型：article-source 含站点名', () => {
      const bm = makeBookmarkItem({ type: 'shortcut' })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      expect(wrapper.find('.article-source').text()).toContain('Example Site')
    })

    it('isSubscribe=true：星标按钮不渲染，操作区只有编辑按钮', () => {
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: true, collectionCode: 'COL1' }
      })
      expect(wrapper.find('.article-star').exists()).toBe(false)
      // isSubscribe=true：只有编辑按钮，无归档/删除
      expect(wrapper.findAll('.article-action').length).toBe(1)
    })

    it('dateString：trashed_at 优先 / published_at 缺失时 fallback "--"', () => {
      const bm = makeBookmarkItem({ published_at: '', created_at: '' })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      expect(wrapper.find('.article-date').text()).toBe('--')
    })
  })

  describe('clickTitle', () => {
    it('isSubscribe=true：pwaOpen /c/<code>/<id> + target=_blank', async () => {
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: true, collectionCode: 'COL1' }
      })
      await wrapper.find('.article-title').trigger('click')
      expect(mockPwaOpen).toHaveBeenCalledWith({ url: '/c/COL1/1000001', target: '_blank' })
    })

    it('shortcut 类型：clickHref（window.open 原 url）', async () => {
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
      const bm = makeBookmarkItem({ type: 'shortcut' })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      await wrapper.find('.article-title').trigger('click')
      expect(openSpy).toHaveBeenCalledWith('https://example.com/article-1', '_blank')
    })

    it('status≠success：clickHref 而非 clickCache', async () => {
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
      const bm = makeBookmarkItem({ status: BookmarkParseStatus.FAILED })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      await wrapper.find('.article-title').trigger('click')
      expect(openSpy).toHaveBeenCalled()
      expect(mockShowSnapshot).not.toHaveBeenCalled()
    })

    it('document 含 slax-reader-panel：仍走 clickCache（优先快照）', async () => {
      const panel = document.createElement('slax-reader-panel')
      document.body.appendChild(panel)
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: false }
      })
      await wrapper.find('.article-title').trigger('click')
      expect(mockPwaOpen).toHaveBeenCalledWith({ url: '/bookmarks/1000001' })
      document.body.removeChild(panel)
    })

    it('普通文章：走 clickCache → pwaOpen /bookmarks/<id>', async () => {
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: false }
      })
      await wrapper.find('.article-title').trigger('click')
      expect(mockPwaOpen).toHaveBeenCalledWith({ url: '/bookmarks/1000001' })
    })
  })

  describe('clickCache + showSnapshotStatusModal', () => {
    it('status=failed + reminder 未禁用：点击 article-source 触发 clickHref（不弹 modal）', async () => {
      // article-source 点击触发 clickHref，不走 clickCache
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
      const bm = makeBookmarkItem({ status: BookmarkParseStatus.FAILED })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      await wrapper.find('.article-source').trigger('click')
      expect(openSpy).toHaveBeenCalled()
    })

    it('status=failed + reminder 已禁用：直接 clickHref 不弹', async () => {
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
      localStorage.setItem('snapshot_reminder_disabled_failed', 'true')
      const bm = makeBookmarkItem({ status: BookmarkParseStatus.FAILED })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      await wrapper.find('.article-source').trigger('click')
      expect(mockShowSnapshot).not.toHaveBeenCalled()
      expect(openSpy).toHaveBeenCalled()
    })
  })

  describe('star / archive / trash / revert', () => {
    it('starBookmark：调 BOOKMARK_STAR + emit bookmarkUpdate + analyticsLog', async () => {
      mockPost.mockResolvedValueOnce({ bookmark_id: 1000001, status: 'star' })
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: false }
      })
      await wrapper.find('.article-star').trigger('click')
      await flushPromises()
      const call = mockPost.mock.calls[0]![0] as { url: string; body: { status: string } }
      expect(call.url).toBe('/v1/bookmark/star')
      expect(call.body.status).toBe('star')
      expect(wrapper.emitted('bookmarkUpdate')).toHaveLength(1)
      expect(mockAnalyticsLog).toHaveBeenCalledWith(expect.objectContaining({ event: 'bookmark_star', is_starred: true }))
    })

    it('archiveBookmark inbox→archive：调 BOOKMARK_ARCHIVE + emit archiveUpdate', async () => {
      mockPost.mockResolvedValueOnce({ bookmark_id: 1000001, status: 'archive' })
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: false }
      })
      // article-actions 内：[0]=编辑, [1]=归档, [2]=删除
      const archiveBtn = wrapper.findAll('.article-action')[1]!
      expect(archiveBtn).toBeDefined()
      await archiveBtn.trigger('click')
      await flushPromises()
      const call = mockPost.mock.calls[0]![0] as { url: string; body: { status: string } }
      expect(call.url).toBe('/v1/bookmark/archive')
      expect(call.body.status).toBe('archive')
      expect(wrapper.emitted('archiveUpdate')).toHaveLength(1)
      expect(wrapper.emitted('archiveUpdate')![0]).toEqual([1000001, true])
    })

    it('archiveBookmark archive→inbox：status=inbox', async () => {
      const bm = makeBookmarkItem({ archived: 'archive' })
      mockPost.mockResolvedValueOnce({ bookmark_id: 1000001, status: 'inbox' })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      // [0]=编辑, [1]=归档（unarchive）
      const unarchiveBtn = wrapper.findAll('.article-action')[1]!
      expect(unarchiveBtn).toBeDefined()
      await unarchiveBtn.trigger('click')
      await flushPromises()
      const call = mockPost.mock.calls[0]![0] as { body: { status: string } }
      expect(call.body.status).toBe('inbox')
      expect(wrapper.emitted('archiveUpdate')![0]).toEqual([1000001, false])
    })

    it('archiveBookmark 失败：showToast Error', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      mockPost.mockRejectedValueOnce(new Error('boom'))
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: false }
      })
      const archiveBtn = wrapper.findAll('.article-action')[1]!
      await archiveBtn.trigger('click')
      await flushPromises()
      expect(mockToastShowToast).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('clickDelete：调 TRASH_BOOKMARK + removeCell stroke + emit delete', async () => {
      vi.useFakeTimers()
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: false }
      })
      // article-actions 内：[0]=编辑, [1]=归档, [2]=删除（danger class）
      const deleteBtn = wrapper.find('.article-action.danger')
      expect(deleteBtn.exists()).toBe(true)
      await deleteBtn.trigger('click')
      const call = mockPost.mock.calls[0]![0] as { url: string }
      expect(call.url).toBe('/v1/bookmark/trash')
      expect(wrapper.find('.article-title').classes()).toContain('stroking')
      await vi.advanceTimersByTimeAsync(500)
      expect(wrapper.emitted('delete')).toHaveLength(1)
      expect(wrapper.find('.article-card').classes()).toContain('deleting')
    })

    it('clickRevert：调 REVERT_BOOKMARK + emit delete（无 stroke）', async () => {
      const bm = makeBookmarkItem({ trashed_at: '2026-01-02T00:00:00.000Z' })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      // isTrashed=true 时：[0]=编辑, [1]=恢复
      const revertBtn = wrapper.findAll('.article-action')[1]!
      expect(revertBtn).toBeDefined()
      await revertBtn.trigger('click')
      await flushPromises()
      const call = mockPost.mock.calls[0]![0] as { url: string }
      expect(call.url).toBe('/v1/bookmark/trash_revert')
      expect(wrapper.emitted('delete')).toHaveLength(1)
    })
  })

  describe('编辑标题', () => {
    it('clickEdit：切到编辑态，editingTitle 预填', async () => {
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: false }
      })
      // 编辑按钮是 article-actions 中第一个 article-action
      const editBtn = wrapper.findAll('.article-action')[0]!
      expect(editBtn).toBeDefined()
      await editBtn.trigger('click')
      expect(wrapper.find('input').exists()).toBe(true)
      const input = wrapper.find('input').element as HTMLInputElement
      expect(input.value).toBe(baseBookmarkItem.title)
    })

    it('updateBookmarkTitle：回车后调 BOOKMARK_ALIAS_TITLE + emit bookmarkUpdate + 退出编辑态', async () => {
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: false }
      })
      const editBtn = wrapper.findAll('.article-action')[0]!
      await editBtn.trigger('click')
      const input = wrapper.find('input')
      await input.setValue('新标题')
      await input.trigger('keydown', { key: 'Enter' })
      await flushPromises()
      const call = mockPost.mock.calls[0]![0] as { url: string; body: { alias_title: string } }
      expect(call.url).toBe('/v1/bookmark/alias_title')
      expect(call.body.alias_title).toBe('新标题')
      const events = wrapper.emitted('bookmarkUpdate')!
      expect(events).toHaveLength(1)
      expect(events[0]![1]).toMatchObject({ alias_title: '新标题' })
      expect(wrapper.find('input').exists()).toBe(false)
    })

    it('编辑后值与原 alias_title 一致：短路不调 post，仅退出编辑态', async () => {
      const bm = makeBookmarkItem({ alias_title: '已存在' })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      const editBtn = wrapper.findAll('.article-action')[0]!
      await editBtn.trigger('click')
      const input = wrapper.find('input')
      await input.setValue('已存在')
      mockPost.mockClear()
      await input.trigger('keydown', { key: 'Enter' })
      await flushPromises()
      expect(mockPost).not.toHaveBeenCalled()
      expect(wrapper.find('input').exists()).toBe(false)
    })

    it('其他键不触发提交', async () => {
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: false }
      })
      const editBtn = wrapper.findAll('.article-action')[0]!
      await editBtn.trigger('click')
      mockPost.mockClear()
      await wrapper.find('input').trigger('keydown', { key: 'Esc' })
      expect(mockPost).not.toHaveBeenCalled()
    })
  })

  describe('route filter 影响 trackListItemInteract', () => {
    it('route.query.filter=archive：analyticsLog section=archive', async () => {
      mockRoute.query = reactive({ filter: 'archive' })
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: false }
      })
      await wrapper.find('.article-star').trigger('click')
      const call = mockAnalyticsLog.mock.calls.find(c => (c[0] as { event: string }).event === 'bookmark_list_item_interact')!
      expect((call[0] as { section: string }).section).toBe('archive')
    })

    it('未知 filter：fallback inbox', async () => {
      mockRoute.query = reactive({ filter: 'random-string' })
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: false }
      })
      await wrapper.find('.article-star').trigger('click')
      const call = mockAnalyticsLog.mock.calls.find(c => (c[0] as { event: string }).event === 'bookmark_list_item_interact')!
      expect((call[0] as { section: string }).section).toBe('inbox')
    })
  })
})
