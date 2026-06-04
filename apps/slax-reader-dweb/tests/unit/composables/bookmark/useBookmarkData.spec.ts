// useBookmarkData composable 单元测试
// 聚焦集成测试（pages/bookmarks/index.spec.ts）覆盖不到的纯逻辑分支：
//   - loadData 翻页（page 递增）与 ending 判定
//   - groupedBookmarks 跨年月日期分组算法
//   - isDataEmpty / showList 各 filterStatus 分支
// composable 内含生命周期钩子（onMounted/onActivated/onUnmounted），故通过最小宿主组件挂载提供组件上下文。
// auto-import（request / addChannelMessageHandler / useI18n 等）走 mockNuxtImport。

import { defineComponent, nextTick, ref } from 'vue'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { baseBookmarkItem } from '~~/tests/fixtures/bookmark'
import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockRequest, mockGet, mockPost, mockAddChannelMessageHandler, mockRemoveChannelMessageHandler, capturedChannelHandler, mockUseI18n, mockT } = vi.hoisted(() => {
  const captured: { value: any } = { value: null }
  const mockGet = vi.fn()
  const mockPost = vi.fn(() => Promise.resolve({}))
  const mockT = vi.fn((key: string, params?: any) => (params ? `${key}__${JSON.stringify(params)}` : key))
  return {
    mockRequest: vi.fn(() => ({ get: mockGet, post: mockPost })),
    mockGet,
    mockPost,
    mockAddChannelMessageHandler: vi.fn((handler: any) => {
      captured.value = handler
    }),
    mockRemoveChannelMessageHandler: vi.fn(),
    capturedChannelHandler: captured,
    mockUseI18n: vi.fn(() => ({ locale: { value: 'en' }, t: mockT })),
    mockT
  }
})

mockNuxtImport('request', () => mockRequest)
mockNuxtImport('useI18n', () => mockUseI18n)
mockNuxtImport('addChannelMessageHandler', () => mockAddChannelMessageHandler)
mockNuxtImport('removeChannelMessageHandler', () => mockRemoveChannelMessageHandler)

// useInfiniteScroll：setup 时异步调一次 callback 模拟首屏加载（与集成测试同款）
vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual<any>('@vueuse/core')
  return {
    ...actual,
    useInfiniteScroll: (_target: any, callback: any) => {
      Promise.resolve().then(() => callback())
      return { reset: vi.fn() }
    },
    useEventListener: vi.fn(),
    useDebounceFn: (fn: any) => fn
  }
})

import { useBookmarkData } from '~~/layers/core/app/composables/bookmark/useBookmarkData'
import { useBookmarkFilter } from '~~/layers/core/app/composables/bookmark/useBookmarkFilter'

// 构造一个可控的 filter stub（不依赖 useRoute，直接给定 filterStatus 等 ref）
const makeFilter = (overrides: Partial<Record<string, any>> = {}): ReturnType<typeof useBookmarkFilter> => {
  const filterStatus = ref(overrides.filterStatus ?? 'inbox')
  const filterTopicId = ref(overrides.filterTopicId ?? 0)
  const filterCollectionId = ref(overrides.filterCollectionId ?? 0)
  return {
    filterStatus,
    filterTopicId,
    filterTopicName: ref(''),
    filterCollectionId,
    filterCollectionCode: ref(''),
    filterCollectionName: ref(''),
    isInTrash: ref(false) as any,
    isCurrentInboxTab: ref(true) as any,
    applyTopic: vi.fn(),
    applyCollection: vi.fn(),
    applyTab: vi.fn()
  } as unknown as ReturnType<typeof useBookmarkFilter>
}

// 通过最小宿主组件挂载 useBookmarkData，暴露其返回值供断言
const mountData = (filter: ReturnType<typeof useBookmarkFilter>, searchText = ref('')) => {
  let api: ReturnType<typeof useBookmarkData> | undefined
  const Host = defineComponent({
    setup() {
      api = useBookmarkData(filter, searchText)
      return () => null
    }
  })
  const wrapper = mountWithApp(Host)
  return { wrapper, api: api! }
}

describe('useBookmarkData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    capturedChannelHandler.value = null
    mockGet.mockResolvedValue([])
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('loadData 分页 + ending', () => {
    it('返回非空数据 → page 递增、不 ending（第二页继续请求）', async () => {
      // 首屏（page=1）返回 1 条，useInfiniteScroll 自动触发一次 onLoadMore
      mockGet.mockResolvedValueOnce([{ ...baseBookmarkItem, id: 1 }])
      const filter = makeFilter()
      const { api } = mountData(filter)
      await flushPromises()
      expect(api.ending.value).toBe(false)
      expect(api.bookmarks?.value ?? []).toBeDefined()
      // 再次 onLoadMore 应以 page=2 请求
      mockGet.mockClear()
      mockGet.mockResolvedValueOnce([{ ...baseBookmarkItem, id: 2 }])
      await api.onLoadMore()
      await flushPromises()
      expect(mockGet).toHaveBeenCalledWith(expect.objectContaining({ query: expect.objectContaining({ page: 2 }) }))
    })

    it('返回空数组 → ending=true（停止继续加载）', async () => {
      mockGet.mockResolvedValue([])
      const filter = makeFilter()
      const { api } = mountData(filter)
      await flushPromises()
      expect(api.ending.value).toBe(true)
    })

    it('topics 且 topicId<1 → 早退 ending=true、不发请求', async () => {
      const filter = makeFilter({ filterStatus: 'topics', filterTopicId: 0 })
      const { api } = mountData(filter)
      await flushPromises()
      expect(api.ending.value).toBe(true)
      expect(mockGet).not.toHaveBeenCalled()
    })
  })

  describe('groupedBookmarks 日期分组', () => {
    it('跨年月 → 每个新年月插入一个 group 标签', async () => {
      mockGet.mockResolvedValueOnce([
        { ...baseBookmarkItem, id: 1, created_at: '2026-01-15T00:00:00.000Z' },
        { ...baseBookmarkItem, id: 2, created_at: '2026-01-20T00:00:00.000Z' },
        { ...baseBookmarkItem, id: 3, created_at: '2026-02-01T00:00:00.000Z' }
      ])
      const filter = makeFilter()
      const { api } = mountData(filter)
      await flushPromises()
      const items = api.groupedBookmarks.value
      const groups = items.filter(i => i.type === 'group')
      const cells = items.filter(i => i.type === 'bookmark')
      // 两个年月（1月、2月）→ 2 个 group；3 条书签
      expect(groups).toHaveLength(2)
      expect(cells).toHaveLength(3)
      // 首项是 group（同月的第一条前插标签）
      expect(items[0].type).toBe('group')
    })

    it('highlights tab → 不分组（返回空数组）', async () => {
      const filter = makeFilter({ filterStatus: 'highlights' })
      const { api } = mountData(filter)
      await flushPromises()
      expect(api.groupedBookmarks.value).toHaveLength(0)
    })
  })

  describe('isDataEmpty / showList 分支', () => {
    it('inbox 空列表 → isDataEmpty=true, showList=false', async () => {
      mockGet.mockResolvedValue([])
      const filter = makeFilter()
      const { api } = mountData(filter)
      await flushPromises()
      expect(api.isDataEmpty.value).toBe(true)
      expect(api.showList.value).toBe(false)
    })

    it('topics 未选 topicId → isDataEmpty=false（占位态，非空）', async () => {
      const filter = makeFilter({ filterStatus: 'topics', filterTopicId: 0 })
      const { api } = mountData(filter)
      await flushPromises()
      expect(api.isDataEmpty.value).toBe(false)
    })

    it('搜索态 searchText 非空 → showList=false', async () => {
      mockGet.mockResolvedValueOnce([{ ...baseBookmarkItem, id: 1 }])
      const searchText = ref('')
      const filter = makeFilter()
      const { api } = mountData(filter, searchText)
      await flushPromises()
      searchText.value = 'foo'
      await nextTick()
      expect(api.showList.value).toBe(false)
    })
  })

  describe('cell handlers', () => {
    it('handleDelete → 移除指定 id + isTransitioning=true', async () => {
      mockGet.mockResolvedValueOnce([
        { ...baseBookmarkItem, id: 1 },
        { ...baseBookmarkItem, id: 2 }
      ])
      const filter = makeFilter()
      const { api } = mountData(filter)
      await flushPromises()
      api.handleDelete(1)
      await nextTick()
      const remaining = api.groupedBookmarks.value.filter(i => i.type === 'bookmark')
      expect(remaining).toHaveLength(1)
      expect(api.isTransitioning.value).toBe(true)
    })

    it('handleCellAliasTitle → 就地更新 alias_title', async () => {
      mockGet.mockResolvedValueOnce([{ ...baseBookmarkItem, id: 1, alias_title: '' }])
      const filter = makeFilter()
      const { api } = mountData(filter)
      await flushPromises()
      api.handleCellAliasTitle(1, 'New Alias')
      await nextTick()
      const cell = api.groupedBookmarks.value.find(i => i.type === 'bookmark') as any
      expect(cell.bookmark.alias_title).toBe('New Alias')
    })
  })

  describe('频道同步注册', () => {
    it('挂载 → addChannelMessageHandler；卸载 → removeChannelMessageHandler', async () => {
      const filter = makeFilter()
      const { wrapper } = mountData(filter)
      await flushPromises()
      expect(mockAddChannelMessageHandler).toHaveBeenCalled()
      expect(capturedChannelHandler.value).toBeTypeOf('function')
      wrapper.unmount()
      expect(mockRemoveChannelMessageHandler).toHaveBeenCalled()
    })
  })
})
