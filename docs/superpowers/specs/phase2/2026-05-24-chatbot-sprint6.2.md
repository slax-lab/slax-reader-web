# 第二期 Sprint 6.2：utils/chatbot.ts ChatBot class 完整覆盖

> 第二期第六个 sprint 第二段。覆盖 PLAN §8 P0 第 4 项 ChatBot 链路核心：`utils/chatbot.ts`（316 行 / class ChatBot + 多个 enum/interface）。这是 graphify 标识的 8 边 god node。

**Goal**：utils/chatbot.ts 完整覆盖到阈值并启用单文件门槛。完成后 utils/ 下除 pwa.ts（推迟第三期）外全部覆盖完毕，**为启用目录级阈值 utils/** 90/85/90/90 铺路\*\*。

**前置文档**：

- `.claude/test-framework/PLAN.md` §8 P0 第 4 项
- 沉淀范式：sprint 1-6.1 全套（特别是 sprint 2.2 useNuxtApp 不能 mock + sprint 6.1 stubGlobal beforeEach + sprint 1 isClient 翻转）

**强制纪律**（继承）：

1. 写 spec 前必须 Read 被测源码
2. 不用 `as any` / `@ts-ignore` / 过松断言（含 (chatbot as any).privateMethod —— 通过公开 API chat() 间接触发私有方法）
3. commit message 英文
4. spec 落盘后过 codex-review-loop.sh 多轮 review

---

## 1. 被测面分析

`apps/slax-reader-dweb/layers/core/app/utils/chatbot.ts`（316 行）。

### 1.1 公开 API（class ChatBot）

| 成员 | 行号 | 行为 |
| --- | --- | --- |
| `constructor(params, callback)` | 66-76 | 按 ChatBotParams 类型分支挂 bookmarkId / shareCode / collection；存 responseCallback |
| `chat(params)` | 78-137 | 调 updateChatStatus(true) → createMessages(params) 拼 body → 调 request().stream({ url: BOT_CHAT, body }) → 拿 callback subscribe → 流式 push chunks 走 LineDecoder + SSEDecoder + handleData → done 时 flush 剩余 + updateChatStatus(false) |
| `destruct()` | 139-141 | `this.responseCallback = undefined`（让 handleData 早退） |
| `get isChatting` | 143-145 | 返回 \_isChatting |

### 1.2 私有方法（通过公开 API 间接覆盖）

| 方法 | 行号 | 关键分支 |
| --- | --- | --- |
| `handleData(data)` | 147-267 | (1) data instanceof Error → STATUS_UPDATE 'error' 分支；(2) responseCallback 为空时早退；(3) data.choices 为 0 → 早退；(4) choice.delta 为空或 length=0 → continue；(5) delta.role==='assistant' + content → CONTENT；(6) delta.role==='tool' + 5 个 funcName（generateQuestion / browser / search / relatedQuestion / searchBookmark）× 3-4 个 status（processing / finished_successfully / finished_failed） |
| `createMessages(params)` | 269-306 | 3 个 ChatParamsType 分支（CONTENT / QUESTIONS / ASK）× 3 个上下文（bookmarkId / shareCode / collection）+ history 拼接 + quote 过滤 |
| `updateChatStatus(isChatting)` | 308-311 | 设 \_isChatting + 调 chatStatusUpdateHandler（如有） |

### 1.3 模块级 helper

`t(text)`（line 314-316）：调 `useNuxtApp().$i18n.t(text)`——sprint 2.2 验证过 useNuxtApp 不能顶层 mock，**必须**用 `vi.spyOn(useNuxtApp().$i18n, 't')` 局部 spy。

---

## 2. 测试切分

新建 `apps/slax-reader-dweb/tests/unit/utils/chatbot.spec.ts`。

按 ChatBot 公开 API 分 4 个 describe：

### 2.1 `describe('constructor')`（4 用例）

- `bookmarkId` 分支：`new ChatBot({ bookmarkId: 1 }, cb)` → instance.bookmarkId=1，shareCode/collection 为 undefined
- `shareCode` 分支
- `collection` 分支：`{ code: 'c', cbId: 2 }`
- responseCallback 被存（通过后续 chat 触发验证）—— **合到 chat 用例**，不单独立 it

实际 3 用例。

### 2.2 `describe('chat — createMessages 路径')`（5 用例）

不真触发 streaming（mockStream resolve undefined callback 即可），只断言 request().stream 收到的 body 形状：

ChatParamsType.CONTENT：

- bookmarkId 上下文 + history 拼接 + quote 过滤（quote.data 长度=0 → undefined）
- shareCode 上下文 + 无 history
- collection 上下文（透传 collection_code + cb_id）+ quote.data 长度>0 → 透传 ChatParamsType.QUESTIONS：
- bookmarkId 上下文 → messages 含 generateQuestion tool_call

ChatParamsType.ASK：

- shareCode 上下文 + questions 文本

**断言**：mockStream 被调 `{ url: '/v1/...BOT_CHAT...', method: 'post', body: ...预期形状 }`。

合计 5 用例。

### 2.3 `describe('chat — handleData 流式分支')`（13 用例）

通过 mockStream 让 callback 被调用 → push 受控 SSE 文本片段 → 断言 responseCallback 收到的 type/data。

- choice.delta 为 assistant + content → CONTENT
- choice.delta 为 tool + funcName='generateQuestion' + status='processing' → STATUS_UPDATE
- generateQuestion + 'finished_successfully' → 同时 STATUS_UPDATE + FUNCTION（2 个 callback）
- browser + 'processing' → STATUS_UPDATE
- browser + 'finished_successfully' → STATUS_UPDATE
- browser + 'finished_failed' → STATUS_UPDATE
- search + 'processing' → STATUS_UPDATE
- search + 'finished_successfully' → STATUS_UPDATE + FUNCTION
- **search + 'finished_failed' → STATUS_UPDATE**（codex review 第 1 轮 P2 补，源码 line 230-234 显式分支）
- relatedQuestion + 'finished_successfully' → FUNCTION
- searchBookmark + 'processing' → STATUS_UPDATE
- searchBookmark + 'finished_successfully' → STATUS_UPDATE + FUNCTION
- searchBookmark + 'finished_failed' → STATUS_UPDATE

13 用例。

### 2.4 `describe('chat — 边界 + isChatting + destruct')`（6 用例）

- chat 开始时 isChatting=true，done 时 isChatting=false（断言两次状态）
- chat 期间触发 chatStatusUpdateHandler（如设置）
- handleData 收到 Error 实例 → STATUS_UPDATE 'error'
- data.choices.length=0 → responseCallback 不被调
- destruct() 后 → responseCallback=undefined（后续 handleData 不调）
- done 时 lineDecoder.flush() 残留行的解析（错误 JSON 走 NOT_SUBSCRIPTION 错误映射）

6 用例。

合计 sprint 6.2：3 + 5 + 13 + 6 = **27 用例**。

---

## 3. mock 链路

### 3.1 顶层 vi.hoisted

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { mockStream, streamCallbackHolder, partialParseMock } = vi.hoisted(() => {
  // request().stream(opts) 返回 callback subscribe function；spec 通过它推 chunks 给 ChatBot
  const streamCallbackHolder: { subscriber: ((text: string, isDone: boolean) => void) | null } = { subscriber: null }
  const mockStream = vi.fn(async _opts => {
    return (subscriber: (text: string, isDone: boolean) => void) => {
      streamCallbackHolder.subscriber = subscriber
    }
  })

  // partialParse 让用例可控制返回值（默认透传 JSON.parse）
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
```

### 3.2 SSEDecoder / LineDecoder：**直接用真实实现，不 mock**

> **codex review 第 1 轮 P1 修订**：原计划 stub class 与真实 `commons/utils/src/decoder.ts` 行为不一致（真实 SSEDecoder 收到**空行**才 emit ServerSentEvent；真实 LineDecoder 用 `\r\n|[\n\r]` 切行 + buffer 残留管理）。stub 偏差会让用例假阳性通过。
>
> **新方案**：spec 直接 import 真实 LineDecoder + SSEDecoder（来自 `@commons/utils/decoder`，**不 vi.mock**）。这两个 class 是纯逻辑、无外部依赖，行为已稳定。
>
> 用例编排时按真实 SSE 协议构造 chunk：每条消息以 `data: <json>\n\n`（双换行结束）格式推入 subscriber。这样 SSEDecoder 在第二个 `\n`（空行）才 emit 事件，与生产路径完全一致。

```ts
// 不 mock，直接用真实
// 在 spec 顶层无需任何 vi.mock decoder

// 用例发送 chunk 的标准格式（验证过与真实 SSE 协议一致）：
const sendChunk = (subscriber: (text: string, isDone: boolean) => void, payload: object) => {
  const chunk = `data: ${JSON.stringify(payload)}\n\n`
  subscriber(chunk, false)
}
```

### 3.3 partialParse mock

partialParseMock 已在 §3.1 顶层 vi.hoisted 内声明并返回。本节只补 `vi.mock` 注册（同一 spec 文件内不要重复 vi.hoisted）：

```ts
// §3.1 已 const { ..., partialParseMock } = vi.hoisted(...) —— 直接复用
vi.mock('@commons/utils/json', () => ({ partialParse: partialParseMock }))
```

> 默认 partialParseMock 透传 `JSON.parse(s)`；用例可 `mockImplementationOnce` 替换返回值或抛错（如 funcName='generateQuestion' 的 args 解析失败用例）。

### 3.3 useNuxtApp().$i18n.t（sprint 2.2 范式）

```ts
let nuxtApp: ReturnType<typeof useNuxtApp>
let tSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  nuxtApp = useNuxtApp()
  tSpy = vi.spyOn(nuxtApp.$i18n, 't').mockImplementation((key: string) => `__T__${key}`)
})

afterEach(() => {
  tSpy.mockRestore()
  vi.restoreAllMocks()
})
```

> spec 内调 `t('util.chatbot.generate_question')` 期望返回 `'__T__util.chatbot.generate_question'`，便于断言哪个 i18n key 被命中。

### 3.4 单元测试编排：触发 chat 后推 chunk + 异步时机

**关键约束**（codex review 第 1 轮 P2 第 4 条修订）：`chat()` async function 在调 `request().stream({...})` 之后**立即 resolve**——它 resolve 的时机是"subscriber 注册完成"，**不**是 done 路径完成。spec 的 chat 一旦 resolve 不能依赖 `await chatPromise` 等到 done 副作用（lineDecoder.flush + updateChatStatus(false)）。要等 done 副作用，**必须等 subscriber('', true) 同步触发**。

```ts
beforeEach(() => {
  // 关键约束（codex P2 第 5 条修订）：每个 it 重置 hoisted holder + mock 调用记录
  // vi.restoreAllMocks 不清 vi.fn，需手动 mockReset / 手动清 holder
  streamCallbackHolder.subscriber = null
  mockStream.mockClear()
  mockRequest.mockClear()
  partialParseMock.mockReset().mockImplementation((s: string) => JSON.parse(s))

  // 重置 i18n spy
  nuxtApp = useNuxtApp()
  tSpy = vi.spyOn(nuxtApp.$i18n, 't').mockImplementation((key: string) => `__T__${key}`)
})

afterEach(() => {
  vi.restoreAllMocks()
})

it('assistant + content → CONTENT callback', async () => {
  const callback = vi.fn()
  const chatbot = new ChatBot({ bookmarkId: 1 }, callback)

  // chat() 调 request().stream() 拿到 subscribe fn 后立即 resolve
  await chatbot.chat({ type: ChatParamsType.CONTENT, content: '你好' })

  // 此时 streamCallbackHolder.subscriber 已注册
  const subscriber = streamCallbackHolder.subscriber!
  expect(subscriber).toBeTruthy()

  // 推一个完整 SSE 消息（data: ... + 空行 \n\n 才让 SSEDecoder emit）
  const payload = {
    choices: [{ delta: [{ role: 'assistant', content: 'Hello!' }] }]
  }
  subscriber(`data: ${JSON.stringify(payload)}\n\n`, false)

  // SSEDecoder 同步 emit + ChatBot.handleData 同步触发 callback
  expect(callback).toHaveBeenCalledWith({
    type: ChatResponseType.CONTENT,
    data: { [ChatResponseType.CONTENT]: 'Hello!' }
  })

  // done 路径：subscriber('', true) 触发 lineDecoder.flush 残留 + updateChatStatus(false)
  // 也是同步调用，不需要 await chatPromise（chatPromise 早就 resolve 了）
  subscriber('', true)
  expect(chatbot.isChatting).toBe(false)
})

// done + 残留行（lineDecoder.flush 路径）用例：
it('done 时 lineDecoder.flush 残留 + 错误 JSON 走 NOT_SUBSCRIPTION 错误映射', async () => {
  const callback = vi.fn()
  const chatbot = new ChatBot({ bookmarkId: 1 }, callback)
  // **关键**：必须 await chat 等到 subscriber 注册完成
  await chatbot.chat({ type: ChatParamsType.CONTENT, content: 'q' })
  const subscriber = streamCallbackHolder.subscriber!
  expect(subscriber).toBeTruthy()

  // 推一段没有 \n 结尾的"残留"文本（buffer 留一行）+ 直接 done
  const errorJson = JSON.stringify({ data: 'NOT_SUBSCRIPTION', message: '需要订阅', code: 403 })
  // 注意：不带 \n\n，flush 才会拿到这一行
  // 由于 LineDecoder 用 newline 切，如果没换行 → buffer 留住，flush 时才 return
  subscriber(errorJson, false)
  subscriber('', true)
  // SSEDecoder 拿到非 'data:' 开头的行返回 null → 走 line.length > 0 分支 → JSON.parse + NOT_SUBSCRIPTION 映射
  expect(callback).toHaveBeenCalledWith(
    expect.objectContaining({
      type: ChatResponseType.STATUS_UPDATE,
      data: { [ChatResponseType.STATUS_UPDATE]: { name: 'error', tips: '__T__util.chatbot.error_not_subscription', status: 'failed' } }
    })
  )
})
```

> **关键**：上面"send chunk 不带 \n\n"的用例是源码 line 103-114 走"line.length > 0 但 sse=null"分支的唯一路径。LineDecoder 真实实现（`commons/utils/src/decoder.ts:90-130`）会把不含 newline 的 chunk 留在 buffer，只有 flush() 才返回。spec 用真实 LineDecoder（§3.2 决策不 mock），这条路径自然走得通。

### 3.5 不需要 mock

- `RESTMethodPath.BOT_CHAT` enum：让真实值生效，断言 url 时直接读 enum
- `RequestMethodType.post`：同上

---

## 4. 启用阈值

实施完后改 `apps/slax-reader-dweb/vitest.config.ts` 在现有 thresholds 块**追加**：

```ts
'layers/core/app/utils/chatbot.ts': {
  lines: 80, branches: 70, functions: 85, statements: 80
}
```

预期实测：lines/functions/statements 接近 100%；branches 可能 ~85-90%（19+ 个 funcName × status 组合分支多，flush 错误路径分支少见）。

---

## 5. Sprint 6.2 任务拆分（2 个 task 串行）

> 27 用例分两个 task，第一个先验证 mock 链路 + 简单分支，第二个补完复杂分支 + 启用阈值。

### Task 1：constructor + createMessages 路径 = 8 用例

新建 spec 文件，落 §3 mock 链路骨架 + §2.1 constructor 3 用例 + §2.2 createMessages 5 用例。

commit：`test(dweb): cover ChatBot constructor + createMessages paths (sprint 6.2.1)`

### Task 2：handleData 流式分支 + 边界 + 启用阈值 = 19 用例

继续 spec 末尾追加 §2.3 handleData 13 用例 + §2.4 边界 6 用例。

跑 coverage 启用阈值。

commit：`test(dweb): cover ChatBot handleData branches + boundaries, enable threshold (sprint 6.2.2)`

---

## 6. 风险

| 风险 | 概率 | 缓解 |
| --- | --- | --- |
| useNuxtApp 不能顶层 mock —— sprint 2.2 已知约束。`t()` helper 是模块级函数，但内部调 `useNuxtApp()` 是运行期；用例内 vi.spyOn(nuxtApp.$i18n, 't') 局部替换 | 低 | sprint 2.2 已验证可行 |
| LineDecoder / SSEDecoder stub 与真实 decoder 行为不一致 —— spec 用例失败可能因 stub bug 而非被测代码 bug | 中 | stub 用业界标准 SSE 协议实现 + 单独写 1 个"sanity check"用例验证 stub decoder 自身工作（从一个完整 SSE 文本切成多 chunk 再合回，验证 LineDecoder.decode + flush 顺序无误）。如发现 stub 偏差，按真实 commons/utils/decoder 调整 |
| chat 是 async 但 resolve 时机是"subscriber 注册完成"——**不**是 done 路径完成（codex 第 1 轮 P2 第 4 条修订） | 高 | 用例 `await chatbot.chat(...)` 仅等 subscriber 注册；done 副作用（lineDecoder.flush + updateChatStatus(false)）由 subscriber('', true) **同步触发**，无需 await chatPromise；handleData 同步触发 callback，subscriber 调用后立即断言 |
| handleData 19+ 分支组合多 —— 用例覆盖不全 branches 不达 70% | 中 | 12 用例已覆盖 funcName × status 主分支；如 branches < 70%，看 coverage 报告找漏分支补 1-2 用例 |
| partialParse 在 funcName='relatedQuestion' 时被跳过（line 179 `args !== null && funcName !== 'relatedQuestion'` 才调 partialParse），用例需覆盖 args=null + funcName='relatedQuestion' 两条分支 | 低 | §2.3 用例 9（relatedQuestion）显式断言 partialParseMock 没被调；其它用例隐式覆盖 args !== null 分支 |
| flush 错误路径（line 103-114）：data.data 命中 NOT_SUBSCRIPTION → 用 t() 翻译；未命中走 data.message 默认；JSON.parse 抛错走 console.error | 中 | §2.4 用例 6 覆盖一条（NOT_SUBSCRIPTION 命中）；未命中 + JSON 抛错 2 条分支 v8 算分支但 ROI 低，本 sprint 不强求 100%（阈值 70 留余量） |

---

## 7. 验收清单

- [ ] 27 用例全过（Task 1: 8 + Task 2: 19）
- [ ] chatbot.ts 覆盖率 ≥ 80/70/85/80（实测期望 lines/functions/statements 100%、branches ≥ 80%）
- [ ] vitest.config.ts 启用单文件阈值，`pnpm test:coverage` 退出码 0
- [ ] 全量 211 → 238 用例通过，0 todo / 0 fail
- [ ] sprint 1-6.1 共 211 用例无回归
- [ ] commit 全英文 message，分 2 commits
- [ ] spec 过 codex-review-loop.sh 多轮全通过

## 8. Self-Review

1. ✓ ChatBot 公开 API（constructor / chat / destruct / isChatting）+ 私有方法（通过 chat 间接触发）全覆盖，**禁绕路** (chatbot as any).privateMethod
2. ✓ **SSEDecoder + LineDecoder 直接用真实实现**（codex 第 1 轮 P1 修订）—— 不 vi.mock 避免 stub 与真实行为偏差导致假阳性；用例按真实 SSE 协议构造 chunk（`data: ... \n\n` 双换行结束消息）
3. ✓ partialParse 用 vi.mock 替成可控 vi.fn，默认透传 JSON.parse
4. ✓ useNuxtApp().$i18n.t 用 vi.spyOn 局部替换（sprint 2.2 范式），每个用例 beforeEach 重新 spy + afterEach restore
5. ✓ chat 异步时机（codex 第 1 轮 P2 第 4 条修订）：`await chatbot.chat(...)` 仅等到 subscriber 注册完成，**不**等 done 路径——subscriber('', true) 同步触发 done 副作用
6. ✓ stream holder + hoisted vi.fn 调用记录每个用例 beforeEach 重置（codex 第 1 轮 P2 第 5 条修订），vi.restoreAllMocks 不清独立 vi.fn
7. ✓ search 'finished_failed' 分支（codex 第 1 轮 P2 第 3 条修订）—— 已纳入 §2.3 第 9 用例
8. ✓ 不在本 sprint 启用 utils/\*\* 目录级阈值——chatbot.ts 跑通后再做总启用 + 移除单文件阈值（pwa.ts 仍 exclude，第三期补阈值）
