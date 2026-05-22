import { vi } from 'vitest'

// request() 是工厂函数，返回 FetchRequest 实例（含 get/post/put/delete 等链式方法）。
// 业务代码用 request().post(...) 链式调用，vi.fn() 默认返回 undefined → .post 必报
// "Cannot read properties of undefined (reading 'post')"。
// 因此 mock 文件级别就把链式方法挂好，spec 用 mockResolvedValueOnce 控制返回值。
//
// 方法名以 commons/utils/src/request.ts 的 FetchRequest 为准：
//   - 标准动词：get / post / put / delete（注意是 delete，不是 del）
//   - 流式与文件：stream / upgrade / uploadFile
// 第二期补 ChatBot / 上传链路时可能用到 stream 与 uploadFile，提前挂位避免测试拿不到方法。
export const mockPost = vi.fn()
export const mockGet = vi.fn()
export const mockPut = vi.fn()
export const mockDelete = vi.fn()
export const mockStream = vi.fn()
export const mockUpgrade = vi.fn()
export const mockUploadFile = vi.fn()

export const mockRequest = vi.fn(() => ({
  post: mockPost,
  get: mockGet,
  put: mockPut,
  delete: mockDelete,
  stream: mockStream,
  upgrade: mockUpgrade,
  uploadFile: mockUploadFile
}))

export const mockGetUserToken = vi.fn(() => 'test-token')
export const mockHaveRequestToken = vi.fn(() => true)

vi.mock('~~/layers/core/app/utils/request', () => ({
  request: mockRequest,
  getUserToken: mockGetUserToken,
  haveRequestToken: mockHaveRequestToken
}))

// spec 内典型用法：
//   import { mockPost } from '~~/tests/mocks/request'
//   beforeEach(() => mockPost.mockReset())
//   mockPost.mockResolvedValueOnce({ token: 'abc' })
