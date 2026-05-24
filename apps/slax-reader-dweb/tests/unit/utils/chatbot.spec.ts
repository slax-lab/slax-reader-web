// utils/chatbot.ts ChatBot 测试套件 —— 第二期 sprint 6.2 Task 1
//
// 关键约束（详见 .claude/test-framework/phase2/sprint6.2-chatbot.md）：
// 1. SSEDecoder / LineDecoder 直接用真实实现（spec §3.2）—— 不 vi.mock，
//    真实 decoder 是纯逻辑无外部依赖；stub 偏差易致假阳性。
// 2. partialParse 用 vi.mock 替成可控 vi.fn，默认透传 JSON.parse；
//    Task 1 不直接断言（createMessages 不调），但 mock 已挂好供 Task 2 复用。
// 3. request() 是 Nuxt auto-import → 用 mockNuxtImport('request', ...) 拦截。
//    request().stream 通过 hoisted mockStream 注册 subscriber 到 streamCallbackHolder。
// 4. useNuxtApp().$i18n.t 用 vi.spyOn 局部替换（sprint 2.2 范式）。
//    Task 1 不调 i18n（createMessages 不用），但 spy 已挂方便 Task 2。
// 5. chat() async：调 request().stream 拿到 callback subscribe fn 后立即 resolve。
//    Task 1 范围内不触发流式 chunk，仅断言 mockStream 收到的 body 形状。
// 6. 每个 it 必须重置 hoisted holder + mock 调用记录（codex 第 1 轮 P2 第 5 条修订）：
//    vi.restoreAllMocks 不清独立 vi.fn，需手动 mockReset / 手动清 holder。

import { RequestMethodType } from '@commons/utils/request'

import { RESTMethodPath } from '@commons/types/const'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockStream, streamCallbackHolder, partialParseMock } = vi.hoisted(() => {
  const streamCallbackHolder: { subscriber: ((text: string, isDone: boolean) => void) | null } = { subscriber: null }
  const mockStream = vi.fn(async () => {
    return (subscriber: (text: string, isDone: boolean) => void) => {
      streamCallbackHolder.subscriber = subscriber
    }
  })
  const partialParseMock = vi.fn((s: string) => JSON.parse(s))
  return { mockStream, streamCallbackHolder, partialParseMock }
})

const { mockRequest } = vi.hoisted(() => ({
  mockRequest: vi.fn(() => ({
    stream: mockStream,
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    upgrade: vi.fn(),
    uploadFile: vi.fn()
  }))
}))

mockNuxtImport('request', () => mockRequest)

vi.mock('@commons/utils/json', () => ({ partialParse: partialParseMock }))

// 注意：不 mock @commons/utils/decoder（spec §3.2 决议直接用真实 LineDecoder + SSEDecoder）

import { ChatBot, ChatParamsType } from '~~/layers/core/app/utils/chatbot'

import type { QuoteData } from '#layers/core/app/components/Chat/type'

beforeEach(() => {
  // hoisted holder + mock 调用记录每个 it 重置
  streamCallbackHolder.subscriber = null
  mockStream.mockClear()
  mockRequest.mockClear()
  partialParseMock.mockReset().mockImplementation((s: string) => JSON.parse(s))

  // sprint 2.2 范式：useNuxtApp().$i18n.t 局部 spy；afterEach 的 vi.restoreAllMocks 自动还原
  vi.spyOn(useNuxtApp().$i18n, 't').mockImplementation((key: string) => `__T__${key}`)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ChatBot constructor', () => {
  it('bookmarkId 分支 → 仅 bookmarkId 被挂', () => {
    const cb = vi.fn()
    const bot = new ChatBot({ bookmarkId: 1 }, cb)
    expect(bot.bookmarkId).toBe(1)
    expect(bot.shareCode).toBeUndefined()
    expect(bot.collection).toBeUndefined()
    expect(bot.responseCallback).toBe(cb)
  })

  it('shareCode 分支 → 仅 shareCode 被挂', () => {
    const cb = vi.fn()
    const bot = new ChatBot({ shareCode: 'sc-001' }, cb)
    expect(bot.shareCode).toBe('sc-001')
    expect(bot.bookmarkId).toBeUndefined()
    expect(bot.collection).toBeUndefined()
    expect(bot.responseCallback).toBe(cb)
  })

  it('collection 分支 → 仅 collection 被挂（{ code, cbId }）', () => {
    const cb = vi.fn()
    const bot = new ChatBot({ collection: { code: 'col-1', cbId: 42 } }, cb)
    expect(bot.collection).toEqual({ code: 'col-1', cbId: 42 })
    expect(bot.bookmarkId).toBeUndefined()
    expect(bot.shareCode).toBeUndefined()
    expect(bot.responseCallback).toBe(cb)
  })
})

describe('ChatBot chat — createMessages 路径', () => {
  it('CONTENT + bookmarkId + history 拼接 + quote.data 长度=0 → undefined', async () => {
    const cb = vi.fn()
    const bot = new ChatBot({ bookmarkId: 42 }, cb)
    const emptyQuote: QuoteData = { source: {}, data: [] }
    await bot.chat({
      type: ChatParamsType.CONTENT,
      content: '你好',
      history: [{ role: 'user', content: '前一条' }],
      quote: emptyQuote
    })

    expect(mockStream).toHaveBeenCalledTimes(1)
    expect(mockStream).toHaveBeenCalledWith({
      url: RESTMethodPath.BOT_CHAT,
      method: RequestMethodType.post,
      body: {
        bm_id: 42,
        share_code: undefined,
        messages: [
          { role: 'user', content: '前一条' },
          { role: 'user', content: '你好' }
        ],
        quote: undefined
      }
    })
  })

  it('CONTENT + shareCode + 无 history → messages 仅含当前 content', async () => {
    const cb = vi.fn()
    const bot = new ChatBot({ shareCode: 'sc-X' }, cb)
    await bot.chat({
      type: ChatParamsType.CONTENT,
      content: 'hi share'
    })

    expect(mockStream).toHaveBeenCalledTimes(1)
    expect(mockStream).toHaveBeenCalledWith({
      url: RESTMethodPath.BOT_CHAT,
      method: RequestMethodType.post,
      body: {
        bm_id: undefined,
        share_code: 'sc-X',
        messages: [{ role: 'user', content: 'hi share' }],
        quote: undefined
      }
    })
  })

  it('CONTENT + collection 上下文（透传 collection_code + cb_id）+ quote.data 长度>0 → 透传 quote.data', async () => {
    const cb = vi.fn()
    const bot = new ChatBot({ collection: { code: 'col-A', cbId: 7 } }, cb)
    const quoteWithData: QuoteData = {
      source: { id: 's1' },
      data: [
        { type: 'text', content: '引用片段 1' },
        { type: 'image', content: 'https://example.com/img.png' }
      ]
    }
    await bot.chat({
      type: ChatParamsType.CONTENT,
      content: '基于引用回答',
      quote: quoteWithData
    })

    expect(mockStream).toHaveBeenCalledTimes(1)
    expect(mockStream).toHaveBeenCalledWith({
      url: RESTMethodPath.BOT_CHAT,
      method: RequestMethodType.post,
      body: {
        bm_id: undefined,
        share_code: undefined,
        collection_code: 'col-A',
        cb_id: 7,
        messages: [{ role: 'user', content: '基于引用回答' }],
        quote: quoteWithData.data
      }
    })
  })

  it('QUESTIONS + bookmarkId → messages 含 generateQuestion tool_call', async () => {
    const cb = vi.fn()
    const bot = new ChatBot({ bookmarkId: 99 }, cb)
    await bot.chat({ type: ChatParamsType.QUESTIONS })

    expect(mockStream).toHaveBeenCalledTimes(1)
    expect(mockStream).toHaveBeenCalledWith({
      url: RESTMethodPath.BOT_CHAT,
      method: RequestMethodType.post,
      body: {
        bm_id: 99,
        share_code: undefined,
        messages: [
          {
            role: 'assistant',
            tool_calls: [{ id: '1', type: 'function', function: { name: 'generateQuestion' } }]
          }
        ]
      }
    })
  })

  it('ASK + shareCode + questions 文本 → messages 含 assistant content', async () => {
    const cb = vi.fn()
    const bot = new ChatBot({ shareCode: 'sc-ask' }, cb)
    await bot.chat({ type: ChatParamsType.ASK, questions: '请问这是什么？' })

    expect(mockStream).toHaveBeenCalledTimes(1)
    expect(mockStream).toHaveBeenCalledWith({
      url: RESTMethodPath.BOT_CHAT,
      method: RequestMethodType.post,
      body: {
        bm_id: undefined,
        share_code: 'sc-ask',
        messages: [{ role: 'assistant', content: '请问这是什么？' }]
      }
    })
  })
})
