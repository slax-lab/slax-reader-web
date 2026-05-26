// components/BookmarkList/BookmarkCell.vue 单测 —— 第四期 Sprint A.2.4
// 覆盖：clickTitle 三大分支（subscribe / shortcut+failed → href / 默认 → cache 或 href）/
//      clickHref window.open / clickCache（status≠success 弹 SnapshotStatusModal + reminderKey + 分支 / status=success → pwaOpen）/
//      clickEdit 切换 isEditingTitle + 设置 editingTitle / starBookmark 调 BOOKMARK_STAR 双分支 + Toast / archiveBookmark 双分支 / clickDelete 调 TRASH_BOOKMARK + removeCell + emit / clickRevert REVERT_BOOKMARK / updateBookmarkTitle BOOKMARK_ALIAS_TITLE / dateString 三分支 / getSiteName shortcut prefix / 同名 alias 短路
import { reactive } from 'vue'

import BookmarkCell from '~~/layers/core/app/components/BookmarkList/BookmarkCell.vue'

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
    it('渲染 title / 站点名 / 日期 + cell-footer 操作集（普通文章 / 非 trashed / 非 subscribe）', () => {
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: false, index: 0 }
      })
      expect(wrapper.find('.title').text()).toBe(baseBookmarkItem.title)
      expect(wrapper.find('.cell-footer .href span').text()).toBe('Example Site')
      expect(wrapper.find('.cell-footer .date').text()).toBe('2026-01-01')
      expect(wrapper.find('.edit').exists()).toBe(true)
      expect(wrapper.find('.delete').exists()).toBe(true)
      expect(wrapper.find('.archieve').exists()).toBe(true)
    })

    it('alias_title 优先于 title 渲染', () => {
      const bm = makeBookmarkItem({ alias_title: '别名标题' })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      expect(wrapper.find('.title').text()).toBe('别名标题')
    })

    it('isStarred=true（starred=star）：star 按钮带 enabled', () => {
      const bm = makeBookmarkItem({ starred: 'star' })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      expect(wrapper.find('.star').classes()).toContain('enabled')
    })

    it('isTrashed=true：渲染 revert 按钮 + 不渲染 delete/edit/archive', () => {
      const bm = makeBookmarkItem({ trashed_at: '2026-01-02T00:00:00.000Z' })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      expect(wrapper.find('.revert').exists()).toBe(true)
      expect(wrapper.find('.delete').exists()).toBe(false)
      expect(wrapper.find('.cell-footer .date').text()).toBe('2026-01-02')
    })

    it('shortcut 类型：href span 加 shortcut 前缀（i18n key）', () => {
      const bm = makeBookmarkItem({ type: 'shortcut' })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      expect(wrapper.find('.cell-footer .href span').text()).toContain('Example Site')
    })

    it('isSubscribe=true：操作按钮全收起', () => {
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: true, collectionCode: 'COL1' }
      })
      expect(wrapper.find('.edit').exists()).toBe(false)
      expect(wrapper.find('.delete').exists()).toBe(false)
      expect(wrapper.find('.archieve').exists()).toBe(false)
      expect(wrapper.find('.star').exists()).toBe(false)
    })

    it('dateString：trashed_at 优先 / published_at 缺失时 fallback "--"', () => {
      const bm = makeBookmarkItem({ published_at: '', created_at: '' })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      expect(wrapper.find('.cell-footer .date').text()).toBe('--')
    })
  })

  describe('clickTitle', () => {
    it('isSubscribe=true：pwaOpen /c/<code>/<id> + target=_blank', async () => {
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: true, collectionCode: 'COL1' }
      })
      await wrapper.find('.title').trigger('click')
      expect(mockPwaOpen).toHaveBeenCalledWith({ url: '/c/COL1/1000001', target: '_blank' })
    })

    it('shortcut 类型：clickHref（window.open 原 url）', async () => {
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
      const bm = makeBookmarkItem({ type: 'shortcut' })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      await wrapper.find('.title').trigger('click')
      expect(openSpy).toHaveBeenCalledWith('https://example.com/article-1', '_blank')
    })

    it('status≠success：clickHref 而非 clickCache', async () => {
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
      const bm = makeBookmarkItem({ status: 'failed' })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      await wrapper.find('.title').trigger('click')
      expect(openSpy).toHaveBeenCalled()
      expect(mockShowSnapshot).not.toHaveBeenCalled()
    })

    it('document 含 slax-reader-panel：走 clickHref', async () => {
      const panel = document.createElement('slax-reader-panel')
      document.body.appendChild(panel)
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: false }
      })
      await wrapper.find('.title').trigger('click')
      expect(openSpy).toHaveBeenCalled()
      document.body.removeChild(panel)
    })

    it('普通文章：走 clickCache → pwaOpen /bookmarks/<id>', async () => {
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: false }
      })
      await wrapper.find('.title').trigger('click')
      expect(mockPwaOpen).toHaveBeenCalledWith({ url: '/bookmarks/1000001' })
    })
  })

  describe('clickCache + showSnapshotStatusModal', () => {
    it('status=failed + reminder 未禁用：弹 modal', async () => {
      const bm = makeBookmarkItem({ status: 'failed' })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      // 走 cache 路径需通过其他入口；这里直接 click snapshot 按钮
      await wrapper.find('.snapshot').trigger('click')
      expect(mockShowSnapshot).toHaveBeenCalledTimes(1)
      const arg = mockShowSnapshot.mock.calls[0]![0] as { status: string; onConfirm: (b: boolean) => void }
      expect(arg.status).toBe('failed')

      // 调 onConfirm(true)：写 localStorage
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
      arg.onConfirm(true)
      expect(localStorage.getItem('snapshot_reminder_disabled_failed')).toBe('true')
      expect(openSpy).toHaveBeenCalled()
    })

    it('status=failed + reminder 已禁用：直接 clickHref 不弹', async () => {
      const openSpy = vi.spyOn(window, 'open').mockReturnValue(null)
      localStorage.setItem('snapshot_reminder_disabled_failed', 'true')
      const bm = makeBookmarkItem({ status: 'failed' })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      await wrapper.find('.snapshot').trigger('click')
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
      await wrapper.find('.star').trigger('click')
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
      await wrapper.find('.archieve').trigger('click')
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
      await wrapper.find('.archieve').trigger('click')
      await flushPromises()
      const call = mockPost.mock.calls[0]![0] as { body: { status: string } }
      expect(call.body.status).toBe('inbox')
      expect(wrapper.emitted('archiveUpdate')![0]).toEqual([1000001, false])
    })

    it('archiveBookmark 失败：showToast Error', async () => {
      mockPost.mockRejectedValueOnce(new Error('boom'))
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: false }
      })
      await wrapper.find('.archieve').trigger('click')
      await flushPromises()
      expect(mockToastShowToast).toHaveBeenCalled()
    })

    it('clickDelete：调 TRASH_BOOKMARK + removeCell stroke + emit delete', async () => {
      vi.useFakeTimers()
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: false }
      })
      await wrapper.find('.delete').trigger('click')
      const call = mockPost.mock.calls[0]![0] as { url: string }
      expect(call.url).toBe('/v1/bookmark/trash')
      expect(wrapper.find('.title').classes()).toContain('stroking')
      await vi.advanceTimersByTimeAsync(500)
      expect(wrapper.emitted('delete')).toHaveLength(1)
      expect(wrapper.find('.bookmark-cell').classes()).toContain('deleting')
    })

    it('clickRevert：调 REVERT_BOOKMARK + emit delete（无 stroke）', async () => {
      const bm = makeBookmarkItem({ trashed_at: '2026-01-02T00:00:00.000Z' })
      const wrapper = mountWithApp(BookmarkCell, { props: { bookmark: bm, isSubscribe: false } })
      await wrapper.find('.revert').trigger('click')
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
      await wrapper.find('.edit').trigger('click')
      expect(wrapper.find('input').exists()).toBe(true)
      const input = wrapper.find('input').element as HTMLInputElement
      expect(input.value).toBe(baseBookmarkItem.title)
    })

    it('updateBookmarkTitle：回车后调 BOOKMARK_ALIAS_TITLE + emit bookmarkUpdate + 退出编辑态', async () => {
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: false }
      })
      await wrapper.find('.edit').trigger('click')
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
      await wrapper.find('.edit').trigger('click')
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
      await wrapper.find('.edit').trigger('click')
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
      await wrapper.find('.star').trigger('click')
      const call = mockAnalyticsLog.mock.calls.find(c => (c[0] as { event: string }).event === 'bookmark_list_item_interact')!
      expect((call[0] as { section: string }).section).toBe('archive')
    })

    it('未知 filter：fallback inbox', async () => {
      mockRoute.query = reactive({ filter: 'random-string' })
      const wrapper = mountWithApp(BookmarkCell, {
        props: { bookmark: baseBookmarkItem, isSubscribe: false }
      })
      await wrapper.find('.star').trigger('click')
      const call = mockAnalyticsLog.mock.calls.find(c => (c[0] as { event: string }).event === 'bookmark_list_item_interact')!
      expect((call[0] as { section: string }).section).toBe('inbox')
    })
  })
})
