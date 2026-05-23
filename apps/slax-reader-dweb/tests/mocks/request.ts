import { vi } from 'vitest'

// dweb 业务代码用 nuxt auto-import 调用 request() / getUserToken() / haveRequestToken()
// （没有显式 import 语句），所以 spec 拦截这些调用必须用 mockNuxtImport 宏。
//
// 本文件提供两件事：
//   1. 共享的 mock 句柄（mockPost / mockGet / ... 等），让所有 spec 用同一份
//   2. 一个返回所有 mock 的 vi.hoisted helper，spec 在自己顶层调用 + 把 mockRequest
//      传给 mockNuxtImport('request', ...) 来挂上链路
//
// 同时附带 vi.mock('#layers/core/app/utils/request', ...) 作为显式 import 路径的兜底
// （目前只 DwebHttpClient.ts 显式用 # 路径 import，未来 spec 测它时仍可命中）。
//
// 方法名以 commons/utils/src/request.ts 的 FetchRequest 为准：
//   - 标准动词：get / post / put / delete（注意是 delete，不是 del）
//   - 流式与文件：stream / upgrade / uploadFile

// vi.hoisted 让所有 spies 在 vi.mock factory 求值时已就绪
export const requestMockHandles = vi.hoisted(() => {
  const post = vi.fn()
  const get = vi.fn()
  const put = vi.fn()
  const del = vi.fn() // 局部变量名 del，导出时仍叫 mockDelete
  const stream = vi.fn()
  const upgrade = vi.fn()
  const uploadFile = vi.fn()

  return {
    mockPost: post,
    mockGet: get,
    mockPut: put,
    mockDelete: del,
    mockStream: stream,
    mockUpgrade: upgrade,
    mockUploadFile: uploadFile,
    mockGetUserToken: vi.fn(() => 'test-token'),
    mockHaveRequestToken: vi.fn(() => true),
    mockRequest: vi.fn(() => ({
      post,
      get,
      put,
      delete: del,
      stream,
      upgrade,
      uploadFile
    }))
  }
})

// 解构对外导出，保持原有命名
export const { mockPost, mockGet, mockPut, mockDelete, mockStream, mockUpgrade, mockUploadFile, mockGetUserToken, mockHaveRequestToken, mockRequest } = requestMockHandles

// 兜底：拦截显式 import 路径（DwebHttpClient.ts 等用 #layers 显式 import 的场景）
// 注意：vi.mock factory 被 hoist 到文件顶部，此时解构的 const（mockRequest 等）还在 TDZ，
// 必须通过 requestMockHandles.xxx 访问（vi.hoisted 结果在 vi.mock 运行前已就绪）。
vi.mock('#layers/core/app/utils/request', () => ({
  request: requestMockHandles.mockRequest,
  getUserToken: requestMockHandles.mockGetUserToken,
  haveRequestToken: requestMockHandles.mockHaveRequestToken
}))
vi.mock('~~/layers/core/app/utils/request', () => ({
  request: requestMockHandles.mockRequest,
  getUserToken: requestMockHandles.mockGetUserToken,
  haveRequestToken: requestMockHandles.mockHaveRequestToken
}))

// spec 内典型用法（auto-import 路径）：
//
//   import { mockPost, mockRequest, mockGetUserToken, mockHaveRequestToken } from '~~/tests/mocks/request'
//
//   mockNuxtImport('request', () => mockRequest)
//   mockNuxtImport('getUserToken', () => mockGetUserToken)
//   mockNuxtImport('haveRequestToken', () => mockHaveRequestToken)
//
//   beforeEach(() => mockPost.mockReset())
//   mockPost.mockResolvedValueOnce({ token: 'abc' })
//
// 注意：mockNuxtImport 是 macro，必须直接写在 spec 顶层（不能封装到 helper 里）。
