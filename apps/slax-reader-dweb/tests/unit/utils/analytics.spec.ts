// utils/analytics.ts 测试套件 —— 第二期 sprint 6.1 Task 2.B
//
// 关键约束（详见 .claude/test-framework/phase2/sprint6.1-utils-light.md §1.5 + §3.5）：
// 1. analytics.ts 模块顶层 `let analytics: Analytics | null = null` 是单例缓存
//    —— 用例 6（第二次调）必须与用例 5（首次调）写在**同一个 it** 内，否则
//    beforeEach 的 vi.resetModules + 动态 import 会把单例清零。
// 2. isServer=true 早退用例（用例 4）走 sprint 1 范式：vi.doMock '@commons/utils/is'
//    + vi.resetModules + 动态 import；it 结束 vi.doUnmock 还原，避免污染其它 it。
// 3. useRuntimeConfig 的 app.baseURL 必须保留 —— nuxt-test-utils 的 router plugin
//    在 setup 期读 baseURL，缺失会让 setupNuxt 抛 "Cannot read ... 'afterEach'"。
// 4. appVersion 缺失分支（用例 2）通过 spec 顶层可变 runtimeConfig 对象翻转，
//    beforeEach 重置；不能在 it 内重新调 mockNuxtImport（macro 限制）。
// 5. firebase/app + firebase/analytics 在本 spec 显式 vi.mock 覆盖 globalMocks 注册。
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { dataLayerPushMock, useScriptGoogleTagManagerMock, initializeAppMock, getAnalyticsMock, logEventMock } = vi.hoisted(() => {
  const dataLayerPushMock = vi.fn()
  return {
    dataLayerPushMock,
    useScriptGoogleTagManagerMock: vi.fn(() => ({ proxy: { dataLayer: { push: dataLayerPushMock } } })),
    initializeAppMock: vi.fn(() => ({}) as unknown),
    getAnalyticsMock: vi.fn(() => ({}) as unknown),
    logEventMock: vi.fn()
  }
})

vi.mock('firebase/app', () => ({ initializeApp: initializeAppMock }))
vi.mock('firebase/analytics', () => ({
  getAnalytics: getAnalyticsMock,
  logEvent: logEventMock
}))

// 顶层可变 runtimeConfig：用例内翻转 appVersion 等字段，beforeEach 还原默认值。
// 必须保留 app.baseURL —— nuxt-test-utils router plugin 在 setupNuxt 期读取。
const runtimeConfig = {
  app: { baseURL: '/' },
  public: {
    appVersion: '1.0.0' as string | undefined,
    FIREBASE_API_KEY: 'k',
    FIREBASE_AUTH_DOMAIN: 'a',
    FIREBASE_DATABASE_URL: 'd',
    FIREBASE_PROJECT_ID: 'p',
    FIREBASE_STORAGE_BUCKET: 's',
    FIREBASE_MESSAGING_SENDER_ID: 'm',
    FIREBASE_APP_ID: 'app',
    FIREBASE_MEASUREMENT_ID: 'me'
  }
}
mockNuxtImport('useRuntimeConfig', () => () => runtimeConfig)
mockNuxtImport('useScriptGoogleTagManager', () => useScriptGoogleTagManagerMock)

let analyticsModule: typeof import('~~/layers/core/app/utils/analytics')

beforeEach(async () => {
  // 单例 `let analytics` 必须每个 it 重置：vi.resetModules + 动态 import 让顶层 let 重新求值
  vi.resetModules()
  dataLayerPushMock.mockReset()
  useScriptGoogleTagManagerMock.mockReset().mockReturnValue({ proxy: { dataLayer: { push: dataLayerPushMock } } })
  initializeAppMock.mockReset().mockReturnValue({})
  getAnalyticsMock.mockReset().mockReturnValue({})
  logEventMock.mockReset()
  runtimeConfig.public.appVersion = '1.0.0'
  runtimeConfig.public.FIREBASE_API_KEY = 'k'
  runtimeConfig.public.FIREBASE_AUTH_DOMAIN = 'a'
  runtimeConfig.public.FIREBASE_DATABASE_URL = 'd'
  runtimeConfig.public.FIREBASE_PROJECT_ID = 'p'
  runtimeConfig.public.FIREBASE_STORAGE_BUCKET = 's'
  runtimeConfig.public.FIREBASE_MESSAGING_SENDER_ID = 'm'
  runtimeConfig.public.FIREBASE_APP_ID = 'app'
  runtimeConfig.public.FIREBASE_MEASUREMENT_ID = 'me'
  analyticsModule = await import('~~/layers/core/app/utils/analytics')
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('analyticsLog', () => {
  it('正常路径 → dataLayer.push 收到 { event, platform, version, ...rest }', () => {
    analyticsModule.analyticsLog({ event: 'bookmark_view', id: 'a1', mode: 'original' })
    expect(dataLayerPushMock).toHaveBeenCalledTimes(1)
    expect(dataLayerPushMock).toHaveBeenCalledWith({
      event: 'bookmark_view',
      id: 'a1',
      mode: 'original',
      platform: 'web',
      version: '1.0.0'
    })
  })

  it("config.public.appVersion 缺失 → version fallback 'unknown'", () => {
    runtimeConfig.public.appVersion = undefined
    analyticsModule.analyticsLog({ event: 'bookmark_view', id: 'a2', mode: 'snapshot' })
    expect(dataLayerPushMock).toHaveBeenCalledTimes(1)
    expect(dataLayerPushMock.mock.calls[0]?.[0]).toMatchObject({ version: 'unknown' })
  })

  it('useScriptGoogleTagManager 抛错 → console.error 被调，不向上抛', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    useScriptGoogleTagManagerMock.mockImplementationOnce(() => {
      throw new Error('GTM unavailable')
    })
    expect(() => analyticsModule.analyticsLog({ event: 'bookmark_view', id: 'a3', mode: 'original' })).not.toThrow()
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0]?.[0]).toBe('[Analytics] Track error:')
    expect(dataLayerPushMock).not.toHaveBeenCalled()
  })
})

describe('firebaseAnalyticsLog', () => {
  it('isServer=true → 早退，不调 initializeApp / getAnalytics / logEvent', async () => {
    vi.doMock('@commons/utils/is', async () => {
      const actual = await vi.importActual<typeof import('@commons/utils/is')>('@commons/utils/is')
      return { ...actual, isClient: false, isServer: true }
    })
    try {
      vi.resetModules()
      const serverModule = await import('~~/layers/core/app/utils/analytics')
      serverModule.firebaseAnalyticsLog({ event: 'bookmark_view', id: 'b1', mode: 'original' })
      expect(initializeAppMock).not.toHaveBeenCalled()
      expect(getAnalyticsMock).not.toHaveBeenCalled()
      expect(logEventMock).not.toHaveBeenCalled()
    } finally {
      vi.doUnmock('@commons/utils/is')
    }
  })

  it('首次调用 → initializeApp + getAnalytics + logEvent 全部被调', () => {
    const fakeApp = { name: 'fake-app' }
    const fakeAnalytics = { id: 'fake-analytics' }
    initializeAppMock.mockReturnValue(fakeApp)
    getAnalyticsMock.mockReturnValue(fakeAnalytics)

    analyticsModule.firebaseAnalyticsLog({ event: 'bookmark_view', id: 'b2', mode: 'original' })
    expect(initializeAppMock).toHaveBeenCalledTimes(1)
    expect(initializeAppMock).toHaveBeenCalledWith({
      apiKey: 'k',
      authDomain: 'a',
      databaseURL: 'd',
      projectId: 'p',
      storageBucket: 's',
      messagingSenderId: 'm',
      appId: 'app',
      measurementId: 'me'
    })
    expect(getAnalyticsMock).toHaveBeenCalledTimes(1)
    expect(getAnalyticsMock).toHaveBeenCalledWith(fakeApp)
    expect(logEventMock).toHaveBeenCalledTimes(1)
    expect(logEventMock).toHaveBeenCalledWith(fakeAnalytics, 'bookmark_view', {
      id: 'b2',
      mode: 'original',
      platform: 'web',
      version: '1.0.0'
    })
  })

  it('第二次调用 → 单例已存，不再调 initializeApp / getAnalytics，只多一次 logEvent', () => {
    // 单例缓存必须在**同一 it 内**首次 + 二次连调验证：
    // beforeEach 的 vi.resetModules 会让 `let analytics` 清零，跨 it 测不到缓存。
    const fakeApp = { name: 'fake-app' }
    const fakeAnalytics = { id: 'fake-analytics' }
    initializeAppMock.mockReturnValue(fakeApp)
    getAnalyticsMock.mockReturnValue(fakeAnalytics)

    analyticsModule.firebaseAnalyticsLog({ event: 'bookmark_view', id: 'b3a', mode: 'original' })
    analyticsModule.firebaseAnalyticsLog({ event: 'bookmark_view', id: 'b3b', mode: 'snapshot' })

    expect(initializeAppMock).toHaveBeenCalledTimes(1)
    expect(getAnalyticsMock).toHaveBeenCalledTimes(1)
    expect(logEventMock).toHaveBeenCalledTimes(2)
    expect(logEventMock).toHaveBeenLastCalledWith(fakeAnalytics, 'bookmark_view', {
      id: 'b3b',
      mode: 'snapshot',
      platform: 'web',
      version: '1.0.0'
    })
  })

  it('initializeApp 抛错 → console.error 被调，不向上抛', () => {
    // 同时翻转所有 FIREBASE_* 配置为空字符串：firebaseAnalyticsLog 内部
    // `${$config.FIREBASE_X || ''}` 模板字符串在 initializeApp 调用前先求值，
    // 覆盖 8 个 `|| ''` 的 falsy 分支（与 case 5/6 的 truthy 分支互补，将 branches 覆盖率推过 70%）
    runtimeConfig.public.FIREBASE_API_KEY = ''
    runtimeConfig.public.FIREBASE_AUTH_DOMAIN = ''
    runtimeConfig.public.FIREBASE_DATABASE_URL = ''
    runtimeConfig.public.FIREBASE_PROJECT_ID = ''
    runtimeConfig.public.FIREBASE_STORAGE_BUCKET = ''
    runtimeConfig.public.FIREBASE_MESSAGING_SENDER_ID = ''
    runtimeConfig.public.FIREBASE_APP_ID = ''
    runtimeConfig.public.FIREBASE_MEASUREMENT_ID = ''

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    initializeAppMock.mockImplementationOnce(() => {
      throw new Error('firebase init failed')
    })
    expect(() => analyticsModule.firebaseAnalyticsLog({ event: 'bookmark_view', id: 'b4', mode: 'original' })).not.toThrow()
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0]?.[0]).toBe('[Analytics] Firebase track error:')
    expect(logEventMock).not.toHaveBeenCalled()
  })
})
