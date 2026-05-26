// useWebBookmark — isClient=false 单元测试（独立文件）
// 因 ESM 本地绑定固化，isClient 切换必须独立 spec + vi.doMock + vi.resetModules + 动态 import
// vi.hoisted 仅放 spy 句柄（不引 ref）

import { ref } from 'vue'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'

const { mockHaveRequestToken, mockUseI18n, mockUseUserSubscribe, mockIsBookmarkBrief, mockUseWebBookmarkArticleRelative } = vi.hoisted(() => ({
  mockHaveRequestToken: vi.fn(() => false),
  mockUseI18n: vi.fn(() => ({ locale: { value: 'en' }, t: vi.fn(k => k) })),
  mockUseUserSubscribe: vi.fn(),
  mockIsBookmarkBrief: vi.fn(() => true),
  mockUseWebBookmarkArticleRelative: vi.fn()
}))

mockNuxtImport('haveRequestToken', () => mockHaveRequestToken)
mockNuxtImport('useI18n', () => mockUseI18n)
mockNuxtImport('useUserSubscribe', () => mockUseUserSubscribe)
mockNuxtImport('navigateTo', () => vi.fn())
mockNuxtImport('useRequestURL', () => () => ({ href: '/' }))
mockNuxtImport('logAnalyzed', () => vi.fn())
mockNuxtImport('logChat', () => vi.fn())
mockNuxtImport('showFeedbackView', () => vi.fn())
mockNuxtImport('isBookmarkBrief', () => mockIsBookmarkBrief)
mockNuxtImport('useWebBookmarkArticleRelative', () => mockUseWebBookmarkArticleRelative)

vi.mock('#layers/core/app/components/Modal', () => ({ showLoginModal: vi.fn() }))

describe('useWebBookmark — isClient=false', () => {
  it('C33: non-client 路径 — 初始化任务不入 tasks 数组（不调 store.getUserInfo）', async () => {
    vi.resetModules()
    vi.doMock('@commons/utils/is', () => ({ isClient: false }))

    mockUseUserSubscribe.mockReturnValue({
      isSubscriptionExpired: ref(false),
      checkSubscriptionExpired: vi.fn(() => false),
      updateSubscribeStatus: vi.fn()
    })
    mockUseWebBookmarkArticleRelative.mockReturnValue({
      allowAction: ref(true),
      bookmarkUserId: ref(1)
    })

    const { setActivePinia, createPinia } = await import('pinia')
    setActivePinia(createPinia())

    const { useWebBookmark } = await import('~~/layers/core/app/composables/bookmark/useWebBookmark')
    const { useUserStore } = await import('~~/layers/core/app/stores/user')
    const store = useUserStore()
    const spy = vi.spyOn(store, 'getUserInfo').mockResolvedValue(undefined as any)

    useWebBookmark({
      chatbot: ref({ addQuoteData: vi.fn() }) as any,
      typeOptions: vi.fn(() => ({ type: 'normal' as const, bmId: 1000001 }))
    })
    await Promise.resolve()
    expect(spy).not.toHaveBeenCalled()
  })
})
