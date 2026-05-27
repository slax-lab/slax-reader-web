// useBookmarkRelative composable 覆盖（sprint 5 task 1）：
// 4 个 type guard + showFeedbackView + useLogBookmark
// 两个 composable（useBookmarkArticleRelative / useWebBookmarkArticleRelative）留 task 2 续。
//
// mock 链路（按 sprint5 设计文档 §3）：
// - useUserStore：被测代码显式 import 自 #layers/core/app/stores/user，因此用 vi.mock 拦截，
//   不走 mockNuxtImport（auto-import 路径不会作用于显式 import 改写后的代码）。
// - showFeedbackModal：被测代码显式 import 自 #layers/core/app/components/Modal，同款 vi.mock。
// - analyticsLog：useBookmarkRelative.ts 直接调用，未 import → Nuxt auto-import，
//   必须 mockNuxtImport（与 sprint 1 useAuth.spec.ts 范式一致）。
//
// 注意：BookmarkDetail.bookmark_id 为 optional，BookmarkDetail.starred 是 'star' | 'unstar' 字符串字面量，
// archived 是 'inbox' | 'archive' | 'later' 字符串字面量（不是 boolean）。fixture 字段值必须使用真实字面量。
//
// logAnalyzed / logChat 当前为占位空实现（{}），待实际实现后补用例。
import { ref } from 'vue'

import { type BookmarkBriefDetail, type BookmarkDetail, BookmarkParseStatus, type InlineBookmarkDetail, type ShareBookmarkDetail } from '@commons/types/interface'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { userStoreMock, showFeedbackModalMock } = vi.hoisted(() => ({
  userStoreMock: vi.fn(() => ({
    userInfo: { userId: 100, email: 'tester@example.com' } as { userId: number; email: string } | null
  })),
  showFeedbackModalMock: vi.fn()
}))

vi.mock('#layers/core/app/stores/user', () => ({
  useUserStore: userStoreMock
}))

vi.mock('#layers/core/app/components/Modal', () => ({
  showFeedbackModal: showFeedbackModalMock
}))

const { analyticsLogMock } = vi.hoisted(() => ({
  analyticsLogMock: vi.fn()
}))
mockNuxtImport('analyticsLog', () => analyticsLogMock)

import {
  type BookmarkArticleDetail,
  BookmarkType,
  isBookmarkBrief,
  isBookmarkDetail,
  isInlineBookmarkDetail,
  isShareBookmarkDetail,
  showFeedbackView,
  useBookmarkArticleRelative,
  useLogBookmark,
  useWebBookmarkArticleRelative,
  type WebBookmarkArticleDetail
} from '~~/layers/core/app/composables/useBookmarkRelative'

// 共用空 marks（type guard / showFeedbackView 都不读字段，只占位让类型通过）
const emptyMarks = { mark_list: [], user_list: {} }

beforeEach(() => {
  showFeedbackModalMock.mockReset()
  analyticsLogMock.mockReset()
  userStoreMock.mockReset().mockReturnValue({ userInfo: { userId: 100, email: 'tester@example.com' } })
  // happy-dom 下允许直接赋值 location.href。锁住 origin / pathname 用于 showFeedbackView 断言。
  window.location.href = 'http://example.test/article/123'
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('type guards', () => {
  describe('isBookmarkDetail', () => {
    it('缺 bookmark_id / starred / archived 之一 → false', () => {
      // bookmark_id 是 optional，省略合法；isBookmarkDetail 检查所有三个字段都存在
      const partial = { user_id: 1 } as Partial<BookmarkDetail>
      expect(isBookmarkDetail(partial as BookmarkDetail)).toBe(false)
    })

    it('三字段齐全 → true', () => {
      const full = {
        bookmark_id: 1,
        title: 't',
        alias_title: 't',
        host_url: 'h',
        target_url: 'u',
        content_icon: '',
        content_cover: '',
        content: '',
        status: BookmarkParseStatus.SUCCESS,
        user_id: 100,
        archived: 'inbox',
        starred: 'unstar',
        marks: emptyMarks,
        tags: [],
        trashed_at: null,
        type: 'article'
      } as BookmarkDetail
      expect(isBookmarkDetail(full)).toBe(true)
    })
  })

  describe('isShareBookmarkDetail', () => {
    it('缺 share_info → false', () => {
      const noShare = { user_id: 1, target_url: 'u' } as Partial<ShareBookmarkDetail>
      expect(isShareBookmarkDetail(noShare as ShareBookmarkDetail)).toBe(false)
    })

    it('有 share_info → true', () => {
      const withShare = {
        share_info: { need_login: false, created_at: '', allow_action: true, share_code: 'abc' },
        user_id: 1
      } as Partial<ShareBookmarkDetail>
      expect(isShareBookmarkDetail(withShare as ShareBookmarkDetail)).toBe(true)
    })
  })

  describe('isBookmarkBrief', () => {
    it('缺 created_at / updated_at 之一 → false', () => {
      const partial = { target_url: 'u' } as Partial<BookmarkBriefDetail>
      expect(isBookmarkBrief(partial as BookmarkBriefDetail)).toBe(false)
    })

    it('三字段齐全 → true', () => {
      const full = {
        target_url: 'u',
        created_at: new Date(),
        updated_at: new Date(),
        title: 't',
        host_url: 'h',
        site_name: 's',
        content_icon: '',
        content_cover: '',
        content_word_count: 0,
        description: '',
        byline: '',
        status: 'success',
        published_at: new Date(),
        marks: emptyMarks,
        bookmark_id: 1,
        alias_title: 't',
        archived: 'inbox',
        starred: 'unstar',
        overview: '',
        key_takeaways: [],
        tags: []
      } as BookmarkBriefDetail
      expect(isBookmarkBrief(full)).toBe(true)
    })
  })

  describe('isInlineBookmarkDetail', () => {
    it('缺 user_info（仅有 share_info）→ false', () => {
      const partial = {
        share_info: { need_login: false, created_at: '', allow_action: true, share_code: 'x' }
      } as Partial<InlineBookmarkDetail>
      expect(isInlineBookmarkDetail(partial as InlineBookmarkDetail)).toBe(false)
    })

    it('share_info + user_info 齐全 → true', () => {
      const full = {
        title: 't',
        target_url: 'u',
        share_info: { need_login: false, created_at: '', allow_action: true, share_code: 'x' },
        marks: emptyMarks,
        user_info: { nick_name: 'n', avatar: '', show_userinfo: true },
        owner_user_id: 200
      } as InlineBookmarkDetail
      expect(isInlineBookmarkDetail(full)).toBe(true)
    })
  })
})

describe('showFeedbackView', () => {
  it('type=Normal → showFeedbackModal 收到 bookmark_detail entry_point + bookmark_id + 拼好的 href / email', () => {
    showFeedbackView({ type: BookmarkType.Normal, title: '标题', bmId: 42 }, 'spam')

    expect(showFeedbackModalMock).toHaveBeenCalledTimes(1)
    expect(showFeedbackModalMock).toHaveBeenCalledWith({
      reportType: 'spam',
      title: '标题',
      href: 'http://example.test/article/123',
      email: 'tester@example.com',
      params: {
        bookmark_id: 42,
        entry_point: 'bookmark_detail',
        target_url: 'http://example.test/article/123'
      }
    })
  })

  it('type=Share → showFeedbackModal 收到 share entry_point + share_code', () => {
    showFeedbackView({ type: BookmarkType.Share, title: '分享标题', shareCode: 'abc-share' }, 'broken')

    expect(showFeedbackModalMock).toHaveBeenCalledTimes(1)
    expect(showFeedbackModalMock).toHaveBeenCalledWith({
      reportType: 'broken',
      title: '分享标题',
      href: 'http://example.test/article/123',
      email: 'tester@example.com',
      params: {
        share_code: 'abc-share',
        entry_point: 'share',
        target_url: 'http://example.test/article/123'
      }
    })
  })

  it('userInfo.email 缺失 → email fallback 空串', () => {
    // 模拟登录态丢失：userInfo 为 null，email 走 `email || ''` 短路
    userStoreMock.mockReturnValueOnce({ userInfo: null })

    showFeedbackView({ type: BookmarkType.Normal, title: 't', bmId: 7 }, 'other')

    expect(showFeedbackModalMock).toHaveBeenCalledTimes(1)
    expect(showFeedbackModalMock.mock.calls[0]![0]).toMatchObject({
      email: '',
      href: 'http://example.test/article/123'
    })
  })
})

describe('useLogBookmark', () => {
  it('type=Normal → analyticsLog 收到 bmId 转字符串', () => {
    useLogBookmark({ type: BookmarkType.Normal, title: 't', bmId: 99 })

    expect(analyticsLogMock).toHaveBeenCalledTimes(1)
    expect(analyticsLogMock).toHaveBeenCalledWith({
      event: 'bookmark_view',
      id: '99',
      mode: 'snapshot'
    })
  })

  it('type=Share → analyticsLog 收到 shareCode 原值', () => {
    useLogBookmark({ type: BookmarkType.Share, title: 't', shareCode: 'share-xyz' })

    expect(analyticsLogMock).toHaveBeenCalledTimes(1)
    expect(analyticsLogMock).toHaveBeenCalledWith({
      event: 'bookmark_view',
      id: 'share-xyz',
      mode: 'snapshot'
    })
  })
})

// ---- task 2：useBookmarkArticleRelative / useWebBookmarkArticleRelative ----
//
// 这两个 composable 返回 Vue computed。spec 内通过 `.value` 强制求值，
// 不依赖 nextTick / effectScope（无副作用，computed 在读取时同步求值）。
//
// fixture 字段必须使用接口真实字面量类型：
//   - BookmarkDetail.starred: 'star' | 'unstar'，archived: 'inbox' | 'archive' | 'later'
//   - BookmarkDetail.bookmark_id?: number（optional，用例 5 故意省略以触发 fallback）
//   - 不允许 as any / @ts-ignore，仅在结构完整时用 as <Type> 窄化
//
// 顶层 mock 链路（userStoreMock / showFeedbackModalMock / analyticsLogMock）由 task 1 注册，
// 嵌套 describe 各自重写 beforeEach 重置 + 重置默认返回值。

const makeBookmarkDetail = (overrides: Partial<BookmarkDetail> = {}): BookmarkDetail =>
  ({
    bookmark_id: 1,
    title: 't',
    alias_title: 't',
    host_url: 'h',
    target_url: 'u',
    content_icon: '',
    content_cover: '',
    content: '',
    status: BookmarkParseStatus.SUCCESS,
    user_id: 42,
    archived: 'inbox',
    starred: 'unstar',
    marks: emptyMarks,
    tags: [],
    trashed_at: null,
    type: 'article',
    ...overrides
  }) as BookmarkDetail

const makeShareBookmarkDetail = (overrides: Partial<ShareBookmarkDetail> = {}): ShareBookmarkDetail =>
  ({
    byline: '',
    content: '',
    content_icon: '',
    content_cover: '',
    content_word_count: 0,
    created_at: '',
    description: '',
    host_url: '',
    published_at: '',
    site_name: '',
    target_url: '',
    title: '',
    share_info: { need_login: false, created_at: '', allow_action: true, share_code: 'x' },
    marks: emptyMarks,
    tags: [],
    user_info: { nick_name: '', avatar: '', show_userinfo: true },
    user_id: 50,
    ...overrides
  }) as ShareBookmarkDetail

const makeBookmarkBrief = (overrides: Partial<BookmarkBriefDetail> = {}): BookmarkBriefDetail =>
  ({
    target_url: 'u',
    created_at: new Date(),
    updated_at: new Date(),
    title: 't',
    host_url: 'h',
    site_name: 's',
    content_icon: '',
    content_cover: '',
    content_word_count: 0,
    description: '',
    byline: '',
    status: 'success',
    published_at: new Date(),
    marks: emptyMarks,
    bookmark_id: 1,
    alias_title: 't',
    archived: 'inbox',
    starred: 'unstar',
    overview: '',
    key_takeaways: [],
    tags: [],
    ...overrides
  }) as BookmarkBriefDetail

const makeInlineBookmarkDetail = (overrides: Partial<InlineBookmarkDetail> = {}): InlineBookmarkDetail =>
  ({
    title: 't',
    target_url: 'u',
    share_info: { need_login: false, created_at: '', allow_action: true, share_code: 'x' },
    marks: emptyMarks,
    user_info: { nick_name: '', avatar: '', show_userinfo: true },
    owner_user_id: 200,
    ...overrides
  }) as InlineBookmarkDetail

describe('useBookmarkArticleRelative', () => {
  beforeEach(() => {
    showFeedbackModalMock.mockReset()
    analyticsLogMock.mockReset()
    userStoreMock.mockReset().mockReturnValue({ userInfo: { userId: 100, email: 'tester@example.com' } })
    window.location.href = 'http://example.test/article/123'
  })

  it('BookmarkDetail（带 bookmark_id）→ allowAction=true, bookmarkUserId=detail.user_id', () => {
    const detail = ref<BookmarkArticleDetail>(makeBookmarkDetail({ user_id: 42 }))
    const { allowAction, bookmarkUserId } = useBookmarkArticleRelative(detail)
    expect(allowAction.value).toBe(true)
    expect(bookmarkUserId.value).toBe(42)
  })

  it('ShareBookmarkDetail + share_info.allow_action=true → allowAction=true（无需 user_id 等于 userId）', () => {
    const detail = ref<BookmarkArticleDetail>(
      makeShareBookmarkDetail({
        user_id: 999,
        share_info: { need_login: false, created_at: '', allow_action: true, share_code: 'x' }
      })
    )
    const { allowAction, bookmarkUserId } = useBookmarkArticleRelative(detail)
    expect(allowAction.value).toBe(true)
    expect(bookmarkUserId.value).toBe(999)
  })

  it('ShareBookmarkDetail + allow_action=false + user_id=userId → allowAction=true', () => {
    const detail = ref<BookmarkArticleDetail>(
      makeShareBookmarkDetail({
        user_id: 100,
        share_info: { need_login: false, created_at: '', allow_action: false, share_code: 'x' }
      })
    )
    const { allowAction, bookmarkUserId } = useBookmarkArticleRelative(detail)
    expect(allowAction.value).toBe(true)
    expect(bookmarkUserId.value).toBe(100)
  })

  it('ShareBookmarkDetail + allow_action=false + user_id≠userId → allowAction=false', () => {
    const detail = ref<BookmarkArticleDetail>(
      makeShareBookmarkDetail({
        user_id: 999,
        share_info: { need_login: false, created_at: '', allow_action: false, share_code: 'x' }
      })
    )
    const { allowAction, bookmarkUserId } = useBookmarkArticleRelative(detail)
    expect(allowAction.value).toBe(false)
    expect(bookmarkUserId.value).toBe(999)
  })

  it('缺 bookmark_id 的 BookmarkDetail（无 share_info）→ allowAction=false, bookmarkUserId=0（fallback 分支）', () => {
    // bookmark_id?: number 是 optional，省略合法。isBookmarkDetail 返回 false，
    // 且 detail 上没有 share_info → 落入两个 computed 的最末 fallback：allowAction=false, bookmarkUserId=0
    const partial = makeBookmarkDetail({ user_id: 42 })
    delete partial.bookmark_id
    const detail = ref<BookmarkArticleDetail>(partial)
    const { allowAction, bookmarkUserId } = useBookmarkArticleRelative(detail)
    expect(allowAction.value).toBe(false)
    expect(bookmarkUserId.value).toBe(0)
  })
})

describe('useWebBookmarkArticleRelative', () => {
  beforeEach(() => {
    showFeedbackModalMock.mockReset()
    analyticsLogMock.mockReset()
    userStoreMock.mockReset().mockReturnValue({ userInfo: { userId: 100, email: 'tester@example.com' } })
    window.location.href = 'http://example.test/article/123'
  })

  it('detail=null → allowAction=false, bookmarkUserId=0', () => {
    const detail = ref<WebBookmarkArticleDetail | null>(null)
    const { allowAction, bookmarkUserId } = useWebBookmarkArticleRelative(detail)
    expect(allowAction.value).toBe(false)
    expect(bookmarkUserId.value).toBe(0)
  })

  it('BookmarkBrief + userInfo 存在 → allowAction=true, bookmarkUserId=userId(=100)', () => {
    const detail = ref<WebBookmarkArticleDetail | null>(makeBookmarkBrief())
    const { allowAction, bookmarkUserId } = useWebBookmarkArticleRelative(detail)
    expect(allowAction.value).toBe(true)
    expect(bookmarkUserId.value).toBe(100)
  })

  it('BookmarkBrief + userInfo 不存在 → bookmarkUserId=0（fallback `userId || 0`）', () => {
    // 一次性翻转 userStore：本用例两次 .value 读取均落入 userInfo=null 分支
    userStoreMock.mockReset().mockReturnValue({ userInfo: null })
    const detail = ref<WebBookmarkArticleDetail | null>(makeBookmarkBrief())
    const { allowAction, bookmarkUserId } = useWebBookmarkArticleRelative(detail)
    // allowAction 在 isBookmarkBrief 分支早返回 true，与 userInfo 无关
    expect(allowAction.value).toBe(true)
    expect(bookmarkUserId.value).toBe(0)
  })

  it('InlineBookmarkDetail + allow_action=true → allowAction=true, bookmarkUserId=owner_user_id', () => {
    const detail = ref<WebBookmarkArticleDetail | null>(
      makeInlineBookmarkDetail({
        owner_user_id: 200,
        share_info: { need_login: false, created_at: '', allow_action: true, share_code: 'x' }
      })
    )
    const { allowAction, bookmarkUserId } = useWebBookmarkArticleRelative(detail)
    expect(allowAction.value).toBe(true)
    expect(bookmarkUserId.value).toBe(200)
  })

  it('InlineBookmarkDetail + allow_action=false + owner_user_id=userId → allowAction=true', () => {
    const detail = ref<WebBookmarkArticleDetail | null>(
      makeInlineBookmarkDetail({
        owner_user_id: 100,
        share_info: { need_login: false, created_at: '', allow_action: false, share_code: 'x' }
      })
    )
    const { allowAction, bookmarkUserId } = useWebBookmarkArticleRelative(detail)
    expect(allowAction.value).toBe(true)
    expect(bookmarkUserId.value).toBe(100)
  })

  it('InlineBookmarkDetail + allow_action=false + owner_user_id≠userId → allowAction=false', () => {
    const detail = ref<WebBookmarkArticleDetail | null>(
      makeInlineBookmarkDetail({
        owner_user_id: 200,
        share_info: { need_login: false, created_at: '', allow_action: false, share_code: 'x' }
      })
    )
    const { allowAction, bookmarkUserId } = useWebBookmarkArticleRelative(detail)
    expect(allowAction.value).toBe(false)
    expect(bookmarkUserId.value).toBe(200)
  })
})
