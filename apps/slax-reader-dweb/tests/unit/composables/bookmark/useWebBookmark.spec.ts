// useWebBookmark composable 单元测试 — 主 spec（isClient=true 路径）
// 沿用 sprint 1.2 useBookmark.spec.ts 的 mock 范式（mockNuxtImport + vi.hoisted + 真实 Pinia store）
// 关键 watch 异步约束（§5.5）：showAnalyzed/showChatbot 内的 if (summariesExpanded.value) 是同步读，
// 但 panelType watch 改值是异步 — 覆盖 log 分支必须调用前先同步设 summariesExpanded.value=true / botExpanded.value=true

import { nextTick, ref } from 'vue'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { baseInlineBookmark } from '~~/tests/fixtures/bookmark'
import { baseUser } from '~~/tests/fixtures/user'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const {
  mockNavigateTo,
  mockUseRequestURL,
  mockUseUserSubscribe,
  mockShowFeedbackView,
  mockLogAnalyzed,
  mockLogChat,
  mockShowLoginModal,
  mockHaveRequestToken,
  mockUseI18n,
  mockIsBookmarkBrief,
  mockUseWebBookmarkArticleRelative,
  mockCheckSubscriptionExpired,
  mockUpdateSubscribeStatus,
  mockT
} = vi.hoisted(() => ({
  mockNavigateTo: vi.fn(),
  mockUseRequestURL: vi.fn(() => ({ href: 'https://example.com/test' })),
  mockUseUserSubscribe: vi.fn(),
  mockShowFeedbackView: vi.fn(),
  mockLogAnalyzed: vi.fn(),
  mockLogChat: vi.fn(),
  mockShowLoginModal: vi.fn(),
  mockHaveRequestToken: vi.fn(() => false),
  mockT: vi.fn((key: string) => key),
  mockUseI18n: vi.fn(),
  mockIsBookmarkBrief: vi.fn(() => true),
  mockUseWebBookmarkArticleRelative: vi.fn(),
  mockCheckSubscriptionExpired: vi.fn(() => false),
  mockUpdateSubscribeStatus: vi.fn()
}))

mockNuxtImport('navigateTo', () => mockNavigateTo)
mockNuxtImport('useRequestURL', () => mockUseRequestURL)
mockNuxtImport('useUserSubscribe', () => mockUseUserSubscribe)
mockNuxtImport('showFeedbackView', () => mockShowFeedbackView)
mockNuxtImport('logAnalyzed', () => mockLogAnalyzed)
mockNuxtImport('logChat', () => mockLogChat)
mockNuxtImport('haveRequestToken', () => mockHaveRequestToken)
mockNuxtImport('useI18n', () => mockUseI18n)
mockNuxtImport('isBookmarkBrief', () => mockIsBookmarkBrief)
mockNuxtImport('useWebBookmarkArticleRelative', () => mockUseWebBookmarkArticleRelative)

vi.mock('#layers/core/app/components/Modal', () => ({
  showLoginModal: mockShowLoginModal
}))

import { PanelItemType, useStar, useWebBookmark, useWebBookmarkDetail } from '~~/layers/core/app/composables/bookmark/useWebBookmark'
import { useUserStore } from '~~/layers/core/app/stores/user'

const makeOptions = () => ({
  chatbot: ref({ addQuoteData: vi.fn() }) as any,
  typeOptions: vi.fn(() => ({ type: 'normal' as const, bmId: 1000001 })),
  initialRequestTask: undefined as (() => Promise<void>) | undefined,
  initialTasksCompleted: undefined as (() => void) | undefined
})

describe('useWebBookmark', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockHaveRequestToken.mockReturnValue(false)
    mockUseUserSubscribe.mockReturnValue({
      isSubscriptionExpired: ref(false),
      checkSubscriptionExpired: mockCheckSubscriptionExpired,
      updateSubscribeStatus: mockUpdateSubscribeStatus
    })
    mockCheckSubscriptionExpired.mockReturnValue(false)
    mockUseI18n.mockReturnValue({ locale: { value: 'en' }, t: mockT })
    mockIsBookmarkBrief.mockReturnValue(true)
    mockUseWebBookmarkArticleRelative.mockReturnValue({
      allowAction: ref(true),
      bookmarkUserId: ref(1)
    })
  })

  afterEach(() => vi.useRealTimers())

  describe('初始化（C1-C2）', () => {
    it('C1: 已登录 — userInfo=baseUser → user=baseUser；redirectHref / 默认 ref 值', () => {
      const store = useUserStore()
      store.user = baseUser
      const result = useWebBookmark(makeOptions())
      expect(result.user.value).toEqual(baseUser)
      expect(result.redirectHref).toBe('https://example.com/test')
      expect(result.panelType.value).toBe('')
      expect(result.isPanelShowing.value).toBe(false)
      expect(result.summariesExpanded.value).toBe(false)
      expect(result.botExpanded.value).toBe(false)
    })

    it('C2: 未登录 — userInfo=null → user.value=null', () => {
      const result = useWebBookmark(makeOptions())
      expect(result.user.value).toBeNull()
    })
  })

  describe('showFeedback（C3）', () => {
    it('C3: 默认 feedbackType="parse_error" → 调 showFeedbackView(options, "parse_error")', () => {
      const options = makeOptions()
      const typeOpts = { type: 'normal' as const, bmId: 1000001 }
      options.typeOptions.mockReturnValue(typeOpts)
      const result = useWebBookmark(options)
      result.showFeedback()
      expect(mockShowFeedbackView).toHaveBeenCalledWith(typeOpts, 'parse_error')
    })
  })

  describe('watch 副作用（C4-C8）', () => {
    it('C4: summariesExpanded=true && !isPanelShowing → isPanelShowing=true', async () => {
      const result = useWebBookmark(makeOptions())
      result.summariesExpanded.value = true
      await nextTick()
      expect(result.isPanelShowing.value).toBe(true)
    })

    it('C5: botExpanded=true && !isPanelShowing → isPanelShowing=true', async () => {
      const result = useWebBookmark(makeOptions())
      result.botExpanded.value = true
      await nextTick()
      expect(result.isPanelShowing.value).toBe(true)
    })

    it('C6: panelType=AI → summariesExpanded=true / botExpanded=false', async () => {
      const result = useWebBookmark(makeOptions())
      result.panelType.value = PanelItemType.AI
      await nextTick()
      expect(result.summariesExpanded.value).toBe(true)
      expect(result.botExpanded.value).toBe(false)
    })

    it('C7: panelType=Chat → summariesExpanded=false / botExpanded=true', async () => {
      const result = useWebBookmark(makeOptions())
      result.panelType.value = PanelItemType.Chat
      await nextTick()
      expect(result.summariesExpanded.value).toBe(false)
      expect(result.botExpanded.value).toBe(true)
    })

    it('C8: panelType=Share（其他）→ summariesExpanded=false / botExpanded=false', async () => {
      const result = useWebBookmark(makeOptions())
      result.summariesExpanded.value = true
      await nextTick()
      result.panelType.value = PanelItemType.Share
      await nextTick()
      expect(result.summariesExpanded.value).toBe(false)
      expect(result.botExpanded.value).toBe(false)
    })
  })

  describe('showAnalyzed 3 分支（C9-C11）', () => {
    it('C9: 未登录 → 早退，panelType 不变', () => {
      const result = useWebBookmark(makeOptions())
      const ret = result.showAnalyzed()
      expect(ret).toBeUndefined()
      expect(result.panelType.value).toBe('')
      expect(mockLogAnalyzed).not.toHaveBeenCalled()
    })

    it('C10: 登录 + summariesExpanded=false → panelType=AI；不调 logAnalyzed（line 80 同步 if 为 false）', () => {
      const store = useUserStore()
      store.user = baseUser
      const result = useWebBookmark(makeOptions())
      const ret = result.showAnalyzed()
      expect(ret).toBe(true)
      expect(result.panelType.value).toBe(PanelItemType.AI)
      expect(mockLogAnalyzed).not.toHaveBeenCalled()
    })

    it('C11: 登录 + 调用前先同步 summariesExpanded=true → 调 logAnalyzed（修订 1 P0 #1 范式）', () => {
      const store = useUserStore()
      store.user = baseUser
      const result = useWebBookmark(makeOptions())
      result.summariesExpanded.value = true
      result.showAnalyzed()
      expect(mockLogAnalyzed).toHaveBeenCalled()
    })
  })

  describe('showChatbot 4 分支（C12-C15）', () => {
    it('C12: 未登录 → 早退', () => {
      const result = useWebBookmark(makeOptions())
      const ret = result.showChatbot()
      expect(ret).toBeUndefined()
      expect(mockLogChat).not.toHaveBeenCalled()
    })

    it('C13: 订阅过期 → 早退', () => {
      const store = useUserStore()
      store.user = baseUser
      mockCheckSubscriptionExpired.mockReturnValue(true)
      const result = useWebBookmark(makeOptions())
      const ret = result.showChatbot()
      expect(ret).toBeUndefined()
      expect(mockLogChat).not.toHaveBeenCalled()
    })

    it('C14: 登录 + 订阅有效 + botExpanded=false → panelType=Chat；不调 logChat', () => {
      const store = useUserStore()
      store.user = baseUser
      const result = useWebBookmark(makeOptions())
      const ret = result.showChatbot()
      expect(ret).toBe(true)
      expect(result.panelType.value).toBe(PanelItemType.Chat)
      expect(mockLogChat).not.toHaveBeenCalled()
    })

    it('C15: 登录 + botExpanded=true（同步设值）→ 调 logChat', () => {
      const store = useUserStore()
      store.user = baseUser
      const result = useWebBookmark(makeOptions())
      result.botExpanded.value = true
      result.showChatbot()
      expect(mockLogChat).toHaveBeenCalled()
    })
  })

  describe('chatBotQuote 4 分支（C16-C19）', () => {
    it('C16: botExpanded=false + 登录 → 调 showChatbot 内部 → addQuoteData', async () => {
      const store = useUserStore()
      store.user = baseUser
      const options = makeOptions()
      const result = useWebBookmark(options)
      result.chatBotQuote({ text: 'q' } as any)
      await nextTick()
      expect(options.chatbot.value.addQuoteData).toHaveBeenCalled()
    })

    it('C17: botExpanded=false + 未登录（showChatbot 返 falsy）→ 早退，addQuoteData 不调', async () => {
      const options = makeOptions()
      const result = useWebBookmark(options)
      result.chatBotQuote({ text: 'q' } as any)
      await nextTick()
      expect(options.chatbot.value.addQuoteData).not.toHaveBeenCalled()
    })

    it('C18: botExpanded=true + isPanelShowing=false → 设 isPanelShowing=true（修订 1 P0 #2 范式）', async () => {
      const store = useUserStore()
      store.user = baseUser
      const options = makeOptions()
      const result = useWebBookmark(options)
      result.botExpanded.value = true
      await nextTick() // flush watch（会把 isPanelShowing 改 true）
      result.isPanelShowing.value = false // 强制改回 false 进入 else-if 分支
      result.chatBotQuote({ text: 'q' } as any)
      expect(result.isPanelShowing.value).toBe(true)
      await nextTick()
      expect(options.chatbot.value.addQuoteData).toHaveBeenCalled()
    })

    it('C19: botExpanded=true + isPanelShowing=true → addQuoteData 调用', async () => {
      const store = useUserStore()
      store.user = baseUser
      const options = makeOptions()
      const result = useWebBookmark(options)
      result.botExpanded.value = true
      await nextTick()
      result.chatBotQuote({ text: 'q' } as any)
      await nextTick()
      expect(options.chatbot.value.addQuoteData).toHaveBeenCalled()
    })
  })

  describe('navigate 系列（C20-C21）', () => {
    it('C20: navigateToBookmarks → navigateTo("/bookmarks", { replace: true })', () => {
      const result = useWebBookmark(makeOptions())
      result.navigateToBookmarks()
      expect(mockNavigateTo).toHaveBeenCalledWith('/bookmarks', { replace: true })
    })

    it('C21: navigateToNotification → navigateTo("/bookmarks?filter=notifications", {})', () => {
      const result = useWebBookmark(makeOptions())
      result.navigateToNotification()
      expect(mockNavigateTo).toHaveBeenCalledWith('/bookmarks?filter=notifications', {})
    })
  })

  describe('loginVerify（C22-C23）', () => {
    it('C22: user 存在 → return true，不调 showLoginModal', () => {
      const store = useUserStore()
      store.user = baseUser
      const result = useWebBookmark(makeOptions())
      expect(result.loginVerify()).toBe(true)
      expect(mockShowLoginModal).not.toHaveBeenCalled()
    })

    it('C23: user=null → 调 showLoginModal({redirect}) 后 return false', () => {
      const result = useWebBookmark(makeOptions())
      expect(result.loginVerify()).toBe(false)
      expect(mockShowLoginModal).toHaveBeenCalledWith({ redirect: 'https://example.com/test' })
    })
  })

  describe('初始化任务（C24-C26）', () => {
    it('C24: isLogin=false → getUserInfo 不调', async () => {
      mockHaveRequestToken.mockReturnValue(false)
      const store = useUserStore()
      const spy = vi.spyOn(store, 'getUserInfo').mockResolvedValue(undefined)
      useWebBookmark(makeOptions())
      await Promise.resolve()
      await Promise.resolve()
      expect(spy).not.toHaveBeenCalled()
    })

    it('C25: isLogin=true + getUserInfo 返 baseUser → user 更新 + refresh + updateSubscribeStatus', async () => {
      mockHaveRequestToken.mockReturnValue(true)
      const store = useUserStore()
      const spy = vi.spyOn(store, 'getUserInfo').mockResolvedValue(baseUser)
      const result = useWebBookmark(makeOptions())
      await Promise.resolve()
      await Promise.resolve()
      await Promise.resolve()
      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy).toHaveBeenNthCalledWith(2, { refresh: true })
      expect(result.user.value).toEqual(baseUser)
      expect(mockUpdateSubscribeStatus).toHaveBeenCalled()
    })

    it('C26: isLogin=true + getUserInfo 首次返 null → 不调 refresh 不调 updateSubscribeStatus', async () => {
      mockHaveRequestToken.mockReturnValue(true)
      const store = useUserStore()
      const spy = vi.spyOn(store, 'getUserInfo').mockResolvedValue(undefined as any)
      useWebBookmark(makeOptions())
      await Promise.resolve()
      await Promise.resolve()
      expect(spy).toHaveBeenCalledTimes(1)
      expect(mockUpdateSubscribeStatus).not.toHaveBeenCalled()
    })
  })

  describe('initialRequestTask + initialTasksCompleted（C27-C28）', () => {
    it('C27: 传入 callback → setTimeout 触发 initialTasksCompleted', async () => {
      vi.useFakeTimers()
      const completed = vi.fn()
      const options = makeOptions()
      options.initialRequestTask = vi.fn().mockResolvedValue(undefined)
      options.initialTasksCompleted = completed
      useWebBookmark(options)
      await vi.runAllTimersAsync()
      expect(options.initialRequestTask).toHaveBeenCalled()
      expect(completed).toHaveBeenCalled()
    })

    it('C28: 未传 callback → Promise.allSettled 仍 resolve，不抛错', async () => {
      vi.useFakeTimers()
      expect(() => useWebBookmark(makeOptions())).not.toThrow()
      await vi.runAllTimersAsync()
    })
  })
})

describe('useWebBookmarkDetail（C29-C31）', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseI18n.mockReturnValue({ locale: { value: 'en' }, t: mockT })
    mockIsBookmarkBrief.mockReturnValue(true)
    mockUseWebBookmarkArticleRelative.mockReturnValue({
      allowAction: ref(true),
      bookmarkUserId: ref(1)
    })
  })

  it('C29: detail.value=null → title=""', () => {
    const detail = ref(null)
    const result = useWebBookmarkDetail(detail)
    expect(result.title.value).toBe('')
  })

  it('C30: detail 非空 + title 非空 → 直接返回 title', () => {
    const detail = ref(baseInlineBookmark) as any
    const result = useWebBookmarkDetail(detail)
    expect(result.title.value).toBe(baseInlineBookmark.title)
  })

  it('C31: detail 非空 + title="" → 调 t("...no_title") fallback', () => {
    const detail = ref({ ...baseInlineBookmark, title: '' }) as any
    const result = useWebBookmarkDetail(detail)
    expect(result.title.value).toBe('component.bookmark_article.no_title')
    expect(mockT).toHaveBeenCalledWith('component.bookmark_article.no_title')
  })
})

describe('useStar（C32）', () => {
  it('C32: useStar() 不抛错', () => {
    expect(() => useStar()).not.toThrow()
  })
})
