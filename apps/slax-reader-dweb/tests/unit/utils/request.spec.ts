// utils/request.ts 测试套件 —— 第二期 sprint 1 的样板基座。
// 整体策略与设计文档 .claude/test-framework/phase2/sprint1-request-ts.md §3 一致：
// 1. FetchRequest mock 通过继承真实 class 来保留父类方法，constructor 里捕获 config 到 lastConfig，
//    供后续 task 直接调拦截器；本 task（1.1）只需要保证 mock 链路能被 import 起来即可。
// 2. useCookies / Toast / useAuth / useRuntimeConfig / navigateTo / useRequestHeaders
//    全部预先 mock 好 —— task 2/3 直接复用，不再二次改 spec 顶层。
// 3. 客户端 / 服务端两个 describe 块各自跑 vi.resetModules + 动态 import，
//    用来对抗 request.ts 顶层 `let requestInstance` 单例缓存以及 isClient/isServer
//    顶层常量被 import 时固化的副作用；服务端块用 vi.doMock 覆盖 @commons/utils/is。
//
// 本 task（1.1）仅落客户端 getUserToken / haveRequestToken 4 用例，
// 服务端块写 it.todo 占位避免空 describe 失败 —— 8 个真用例由 task 1.3 补。
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// FetchRequest mock：继承真实 class 以保留 combineUrlWithQuery 等方法，
// constructor 把传入的 config 暴露到 lastConfig，供 task 1.2 直接调拦截器。
const lastConfig = vi.hoisted(() => ({ value: null as any }))
vi.mock('@commons/utils/request', async () => {
  const actual = await vi.importActual<typeof import('@commons/utils/request')>('@commons/utils/request')

  class FetchRequestMock extends actual.FetchRequest {
    constructor(options: any) {
      super(options)
      lastConfig.value = options
    }
  }

  return {
    ...actual,
    FetchRequest: FetchRequestMock
  }
})

// useCookies：getUserToken 客户端分支唯一来源
const { cookieGet } = vi.hoisted(() => ({ cookieGet: vi.fn() }))
vi.mock('@vueuse/integrations/useCookies', () => ({
  useCookies: () => ({ get: cookieGet })
}))

// Toast：errorInterceptor 客户端分支调用点。ToastType 枚举对齐 layers/core/app/components/Toast/type.ts
const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }))
vi.mock('#layers/core/app/components/Toast', () => ({
  default: { showToast },
  ToastType: { Normal: 'normal', Success: 'success', Error: 'error' }
}))

// useAuth：responseInterceptor 401 分支。request.ts:46 `useAuth().clearAuth()` 是 nuxt auto-import，
// 必须用 mockNuxtImport 拦截 —— vi.mock 模块路径方式拦不到 auto-import 改写后的代码（与 useAuth.spec.ts 同模式）
const { clearAuth } = vi.hoisted(() => ({ clearAuth: vi.fn() }))
mockNuxtImport('useAuth', () => () => ({ clearAuth }))

// runtimeConfig 必须保留 app.baseURL：nuxt-test-utils 的 setupNuxt 会启动 router plugin，
// 该 plugin 读取 useRuntimeConfig().app.baseURL，缺失会导致 setupNuxt 报
// "Cannot read properties of undefined (reading 'afterEach')"。
const runtimeConfig = {
  app: { baseURL: '/' },
  public: {
    DWEB_API_BASE_URL: 'https://api.test',
    COOKIE_TOKEN_NAME: 'token'
  }
}
mockNuxtImport('useRuntimeConfig', () => () => runtimeConfig)

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))
mockNuxtImport('navigateTo', () => navigateToMock)

const { requestHeadersMock } = vi.hoisted(() => ({ requestHeadersMock: vi.fn(() => ({}) as Record<string, string>) }))
mockNuxtImport('useRequestHeaders', () => requestHeadersMock)

describe('客户端环境', () => {
  // happy-dom 默认 isClient=true（@commons/utils/is.ts 用 typeof window），
  // 因此本 describe 块不需要再 vi.doMock —— 直接动态 import 即可看到客户端分支。
  let requestModule: typeof import('~~/layers/core/app/utils/request')

  beforeEach(async () => {
    // 强制清模块缓存：让 request.ts 顶层的 requestInstance / isClient/isServer 重新求值
    vi.resetModules()
    showToast.mockClear()
    navigateToMock.mockClear()
    clearAuth.mockClear()
    cookieGet.mockReset().mockReturnValue(undefined)
    lastConfig.value = null
    requestModule = await import('~~/layers/core/app/utils/request')
  })

  describe('getUserToken', () => {
    it('cookies.get 返回 token → 返回该 token', () => {
      cookieGet.mockReturnValue('client-token-x')
      expect(requestModule.getUserToken()).toBe('client-token-x')
      // 必须读 COOKIE_TOKEN_NAME 配置；这里同时锁定 useCookies().get 被调用，避免实现走到错误分支
      expect(cookieGet).toHaveBeenCalledWith('token')
    })

    it('cookies.get 返回 undefined → 返回 undefined', () => {
      // beforeEach 已设 mockReset + mockReturnValue(undefined)，无需再设
      expect(requestModule.getUserToken()).toBeUndefined()
    })
  })

  describe('haveRequestToken', () => {
    it('token 存在 → true', () => {
      cookieGet.mockReturnValue('any-token')
      expect(requestModule.haveRequestToken()).toBe(true)
    })

    it('token 不存在 → false', () => {
      expect(requestModule.haveRequestToken()).toBe(false)
    })
  })

  describe('request() 工厂', () => {
    it('第二次调 request() 返回同一实例（单例缓存生效）', () => {
      const r1 = requestModule.request()
      const r2 = requestModule.request()
      expect(r1).toBe(r2)
    })

    it('客户端实例化触发 FetchRequestMock 构造，捕获到 config', () => {
      // 调用 request() 之前 lastConfig.value 已被 beforeEach 重置为 null
      expect(lastConfig.value).toBeNull()
      requestModule.request()
      expect(lastConfig.value).not.toBeNull()
      expect(lastConfig.value.baseUrl).toBe('https://api.test')
    })

    it('baseUrl 取自 useRuntimeConfig().public.DWEB_API_BASE_URL', () => {
      requestModule.request()
      expect(lastConfig.value.baseUrl).toBe(runtimeConfig.public.DWEB_API_BASE_URL)
    })
  })

  describe('requestInterceptors', () => {
    it('cookie 中存在 token → 注入 Authorization: Bearer <token>', async () => {
      cookieGet.mockReturnValue('tk-1')
      requestModule.request()
      const result = await lastConfig.value.requestInterceptors({ url: '/x', headers: {} })
      expect(result.headers.Authorization).toBe('Bearer tk-1')
    })

    it('cookie 中无 token → 不注入 Authorization', async () => {
      // beforeEach 已将 cookieGet 设为返回 undefined
      requestModule.request()
      const result = await lastConfig.value.requestInterceptors({ url: '/x', headers: {} })
      expect(result.headers).not.toHaveProperty('Authorization')
    })

    it('调用方传入的其它 header 字段被原样保留', async () => {
      cookieGet.mockReturnValue('tk-2')
      requestModule.request()
      const result = await lastConfig.value.requestInterceptors({
        url: '/x',
        headers: { 'X-Custom': 'v1' }
      })
      expect(result.headers['X-Custom']).toBe('v1')
      expect(result.headers.Authorization).toBe('Bearer tk-2')
    })

    it('调用方已提供 Authorization → 行为快照：调用方值优先（源码 spread 顺序决定）', async () => {
      // 源码 request.ts:37-40：{ Authorization: `Bearer ${token}`, ...(options.headers ?? {}) }
      // options.headers 在后展开，调用方传入的 Authorization 会覆盖 token 注入值
      cookieGet.mockReturnValue('tk-from-cookie')
      requestModule.request()
      const result = await lastConfig.value.requestInterceptors({
        url: '/x',
        headers: { Authorization: 'Bearer caller-supplied' }
      })
      expect(result.headers.Authorization).toBe('Bearer caller-supplied')
    })
  })

  describe('responseInterceptors', () => {
    it('status 401 → 调 useAuth().clearAuth() 并 navigateTo("/login")，response 原样返回', async () => {
      requestModule.request()
      const response = { status: 401, data: null, message: '' }
      const result = await lastConfig.value.responseInterceptors(response)
      expect(clearAuth).toHaveBeenCalledTimes(1)
      expect(navigateToMock).toHaveBeenCalledWith('/login')
      // 401 分支结束后仍把 response 原样向下游传递（包含 401 status）
      expect(result).toBe(response)
      expect(result.status).toBe(401)
    })

    it('status 200 → 直接透传，不触发 clearAuth / navigateTo', async () => {
      requestModule.request()
      const response = { status: 200, data: { ok: true }, message: '' }
      const result = await lastConfig.value.responseInterceptors(response)
      expect(clearAuth).not.toHaveBeenCalled()
      expect(navigateToMock).not.toHaveBeenCalled()
      expect(result).toBe(response)
    })
  })

  describe('errorInterceptors（客户端）', () => {
    it('RequestError 且带 message → Toast 展示 error.message', async () => {
      requestModule.request()
      // §3.1 mock 用了 ...actual spread，这里 import 拿到的仍是真实 RequestError class，instanceof 判定有效
      const { RequestError } = await import('@commons/utils/request')
      const err = new RequestError({ message: 'biz error', name: 'BIZ', code: 1001 })
      lastConfig.value.errorInterceptors(err)
      expect(showToast).toHaveBeenCalledTimes(1)
      const arg = showToast.mock.calls[0][0]
      expect(arg.text).toBe('biz error')
      // ToastType.Error 真实值见 layers/core/app/components/Toast/type.ts
      expect(arg.type).toBe('error')
    })

    it('非 RequestError → Toast 展示 `${error}` 字符串化结果', async () => {
      requestModule.request()
      const err = new Error('plain error')
      lastConfig.value.errorInterceptors(err)
      expect(showToast).toHaveBeenCalledTimes(1)
      const arg = showToast.mock.calls[0][0]
      // `${new Error('plain error')}` === 'Error: plain error'
      expect(arg.text).toBe(`${err}`)
      expect(arg.type).toBe('error')
    })
  })
})

describe('服务端环境', () => {
  // vi.doMock 不会被 hoist，配合下方 beforeEach 的 vi.resetModules 让本 describe 单独看到 isServer=true
  beforeAll(() => {
    vi.doMock('@commons/utils/is', () => ({ isClient: false, isServer: true }))
  })
  afterAll(() => {
    vi.doUnmock('@commons/utils/is')
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let requestModule: typeof import('~~/layers/core/app/utils/request')

  beforeEach(async () => {
    vi.resetModules()
    requestHeadersMock.mockReset().mockReturnValue({})
    lastConfig.value = null
    requestModule = await import('~~/layers/core/app/utils/request')
  })

  // task 1.3 在此 describe 块补 8 个真用例（getUserToken 服务端 2 / ServerRequest fetchRequest 5 / errorInterceptor 服务端 1）
  it.todo('Task 3 will fill server-side cases')
})
