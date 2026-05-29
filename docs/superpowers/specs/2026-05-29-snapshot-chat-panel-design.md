# SnapshotChatPanel 设计文档

> 编制日期：2026-05-29分支：`feature/snapshot-detail-redesign` 关联设计稿：`.claude/new-design/slax-reader-snapshot.md` §5.2 Chat 子面板关联完成记录：`.claude/new-design/snapshot-refactor-completion.md`

---

## 一、背景与目标

详情页重构（Phase 1–7）已完成顶栏、正文、工具栏、评论面板等模块。当前 `SnapshotSidePanel` 的 `#chat` slot 挂载的是旧版 `ChatBot.vue`，其 UI 与 snapshot 设计稿存在以下差距：

| 差距点   | 现状 ChatBot.vue     | snapshot 设计要求                                                                              |
| -------- | -------------------- | ---------------------------------------------------------------------------------------------- |
| 空态     | 简单文字 + 描述      | 星形图标 + 文案 + 3 条可点击建议问题胶囊                                                       |
| 用户消息 | 右对齐气泡（旧样式） | `color-mix(in srgb, var(--slax-text) 7%, var(--slax-surface))` 底色，圆角 `14px 14px 4px 14px` |
| AI 消息  | 左对齐气泡           | 无气泡，流式光标（`chatCaretBlink`），完成后复制按钮                                           |
| 引用块   | 左侧竖线 + 旧样式    | `margin-bottom: -12px` 紧贴气泡，右对齐，accent 竖线                                           |
| 输入框   | 独立样式             | 复用 `.comment-composer` 规范（与评论面板一致）                                                |

**目标**：新建 `SnapshotChatPanel.vue`，完全对齐 snapshot 设计，核心 SSE/流式逻辑复用 `chatbot.ts` 的 `ChatBot` 类，不破坏现有 `ChatBot.vue` 及其测试。

---

## 二、方案选型

### 方案 A：直接修改 ChatBot.vue

- 优点：改动集中
- 缺点：破坏 `ChatBot.spec.ts` 测试覆盖；BubbleMessage/QuestionMessage/TipsMessage 子组件体系与 snapshot 消息模型差异大，强行对齐导致职责混乱

### 方案 B（选定）：新建 SnapshotChatPanel.vue，复用 ChatBot 类

- 优点：不破坏现有组件和测试；设计完全对齐；chatbot.ts 核心逻辑零重复；与评论面板风格一致
- 缺点：新增一个文件，消息列表管理逻辑需从 ChatBot.vue 迁移

### 方案 C：薄包装 + 样式注入

- 不可行：空态由 ChatBot.vue 内部状态控制，薄包装无法干预内部渲染

**决策：方案 B**

---

## 三、架构设计

```
SnapshotChatPanel.vue
├── 核心逻辑层：实例化 chatbot.ts 的 ChatBot 类
│   ├── SSE 流式处理（ChatBot.chat()）
│   ├── 消息解析回调（ChatResponseType.CONTENT / FUNCTION / STATUS_UPDATE）
│   └── 状态更新（chatStatusUpdateHandler）
├── 消息状态层（从 ChatBot.vue 迁移）
│   ├── messageList: Ref<MessageItem[]>
│   ├── bufferMessage: Ref<BubbleMessageItem | null>
│   ├── bufferMarkdownContent: Ref<string>
│   └── isChatting: Ref<boolean>
├── UI 层（按 snapshot §5.2 重写）
│   ├── 空态（#chatEmpty）
│   ├── 消息流（.chat-messages）
│   └── 输入框（复用 .comment-composer 规范）
└── 暴露接口（与 ChatBot.vue 保持一致）
    ├── addQuoteData(data: QuoteData): void
    └── focusTextarea(): void
```

**复用的子组件**（不重写）：

- `TipsMessage.vue`：仅承载 `generateQuestion` 和 `error` 类型提示（search/browser/searchBookmark loading tips 在 `.chat-msg-ai` 内 inline 渲染，不走 TipsMessage）
- `QuestionMessage.vue`：建议问题 / 相关问题点击
- `DotLoading.vue`：加载中三点动画

---

## 四、详细设计

### 4.1 空态（`#chatEmpty`）

触发条件：`messageList.length === 0 && !isChatting`

```
┌─────────────────────────────────┐
│         (72px padding top)      │
│                                 │
│    ┌──────┐                     │
│    │  ★  │  36×36 圆形容器      │
│    └──────┘  accent-bg 底       │
│                                 │
│  向 AI 提问，深入理解文章内容    │
│  或在正文中划选片段直接发起对话  │
│  (13px / text-muted / 1.6)      │
│                                 │
│  [这篇文章的核心观点是什么？]    │
│  [有哪些值得深入了解的概念？]    │
│  [作者的主要论据是什么？]        │
│  (胶囊按钮，点击直接发送)        │
└─────────────────────────────────┘
```

建议问题硬编码（i18n key 形式，支持多语言）：

```ts
const SUGGESTIONS = [
  'component.snapshot_chat.suggestion_1', // 这篇文章的核心观点是什么？
  'component.snapshot_chat.suggestion_2', // 有哪些值得深入了解的概念？
  'component.snapshot_chat.suggestion_3' // 作者的主要论据是什么？
]
```

胶囊样式：

- 12px / `var(--slax-text-muted)` / `var(--slax-bg)` 底 + `1px solid var(--slax-border)` + `border-radius: 999px`
- hover：字变 `var(--slax-accent)`、边框变 `color-mix(in srgb, var(--slax-accent) 40%, var(--slax-border))`、底变 `var(--slax-accent-bg)`
- 点击：调用 `sendMessage(t(key))`（施工时需将 `sendMessage` 扩展为 `sendMessage(text?: string)`：有参数时用参数文本替代 `inputText` 发送，但**仍保留 `isChatting` 防重入检查**，只绕过"输入框为空"这一项；这样建议问题点击可在非 chatting 状态下直接发送，同时防止流式回复中重复发送）

### 4.2 消息流（`.chat-messages`）

布局：`display: flex; flex-direction: column; gap: 20px; overflow-y: auto; overscroll-behavior: contain`

#### 用户消息 `.chat-msg-user`

```
                    ┌──────────────────────┐
                    │  用户输入的文字内容   │  ← 右对齐气泡
                    └──────────────────────┘
```

- 右对齐（`align-self: flex-end`），max-width 85%
- 底色：`color-mix(in srgb, var(--slax-text) 7%, var(--slax-surface))`
- 14px / line-height 1.6 / `white-space: pre-wrap`
- 圆角：`14px 14px 4px 14px`
- padding：`10px 14px`

#### 引用块 `.chat-msg-quote`（有 quoteInfo 时，显示在用户消息上方）

```
                    │ 引用的正文片段内容   │  ← 右对齐，左侧 3px accent 竖线
                    │ 最多 3 行截断        │
```

- 右对齐（`align-self: flex-end`），max-width 85%
- 左侧 3px `var(--slax-accent)` 竖线 + `var(--slax-accent-bg)` 底
- 12px / `var(--slax-text-muted)` / line-height 1.55
- `-webkit-line-clamp: 3` 截断
- `margin-bottom: -12px`（紧贴下方用户气泡）
- padding：`6px 10px 6px 12px`

#### AI 消息 `.chat-msg-ai`

```
AI 回复的内容，支持 Markdown 渲染
流式输出时末尾有闪烁光标 |
输出完成后右下角出现复制按钮
```

- 左对齐（`align-self: flex-start`），无气泡背景
- 14px / line-height 1.75 / `white-space: pre-wrap`
- Markdown 渲染（复用 `parseMarkdownText`，链接加 `target="_blank"`）

**加载态 `.is-loading`**（isChatting 且 bufferMessage 为空时）：

- 复用 `<DotLoading indicate-color="var(--slax-text-light)" />`

**流式光标 `.chat-msg-ai-caret`**（bufferMessage.isBuffering 时）：

```css
@keyframes chatCaretBlink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
.chat-msg-ai-caret {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--slax-accent);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: chatCaretBlink 0.9s steps(1) infinite;
}
```

**完成后工具栏 `.chat-msg-ai-tools`**（`!isBuffering` 时追加）：

- 复制按钮 26×26，hover 时 `var(--slax-accent)` + `var(--slax-accent-bg)`
- 点击后 `position: absolute` tooltip 显示「已复制」（11px / accent 字 + accent-bg 底），1.5s 后消失

#### Tips 消息

直接复用 `<TipsMessage :tips="message" />`（不重写）

#### 相关问题 / 建议问题

直接复用 `<QuestionMessage :question="message" @question-click="questionClick" />`（不重写）

### 4.3 输入框区域

复用 `.comment-composer` 样式规范（与 `SnapshotCommentComposer.vue` 视觉一致）：

```
┌─────────────────────────────────────────┐  ← 上边线 1px border
│ │ 引用的文字片段（最多 2 行）      [✕] │  ← 引用条（.replying 状态）
├─────────────────────────────────────────┤
│ 输入你的问题...                         │  ← textarea
│                                         │
│ Enter 发送 · Shift+Enter 换行  [发送]   │  ← 操作行
└─────────────────────────────────────────┘
```

**容器样式**：

- `background: var(--slax-bg)`
- `border-top: 1px solid var(--slax-border)`
- `box-shadow: 0 -8px 16px -8px color-mix(in srgb, var(--slax-accent) 6%, transparent)`
- focus-within：边线变 `color-mix(in srgb, var(--slax-accent) 35%, transparent)`，光晕加深到 10%

**引用条 `.chat-composer-quote`**（有 quoteInfo 时显示）：

- 左侧 3px `var(--slax-accent)` 竖线 + `var(--slax-accent-bg)` 底
- 12px / `var(--slax-text-muted)` / line-height 1.55，最多 2 行截断
- 右侧 ✕ 取消按钮（调用 `closeQuote()`）

**textarea**：

- 13px / line-height 1.6 / `var(--slax-text)`
- min-height 40px / max-height 120px，`resize: none`
- placeholder：`var(--slax-text-light)`
- Enter 发送 / Shift+Enter 换行（含 IME 保护，复用 ChatBot.vue 的 `onKeyDown` 逻辑）

**发送按钮**：

- 设计系统「主按钮 Primary」规格：12px / weight 500 / padding 6/16 / `var(--slax-accent)` 底 + white 字 / 6px 圆角
- 禁用态：`opacity: 0.35`（空输入或 chatting 中）
- hover：`translateY(-1px)` + 暖阴影

---

## 五、消息逻辑迁移清单

以下逻辑从 `ChatBot.vue` 完整迁移到 `SnapshotChatPanel.vue`，**不重写**：

| 函数                                      | 说明                                                          |
| ----------------------------------------- | ------------------------------------------------------------- |
| `pushBuffer(content)`                     | 流式消息缓冲，处理 text/links/tips/related-question/bookmarks |
| `bufferToMessage()`                       | 将 buffer 转为正式消息插入列表                                |
| `updateTipsSearchStatus(success)`         | 更新搜索 tips 状态                                            |
| `updateTipsBrowserStatus(success)`        | 更新浏览器 tips 状态                                          |
| `updateTipsSearchBookmarkStatus(success)` | 更新书签搜索 tips 状态                                        |
| `discardSearch()`                         | 清除 loading 中的搜索 tips                                    |
| `questionClick(question)`                 | 点击建议问题，清理同组其他问题并发送                          |
| `relatedQuestionClick(message, question)` | 点击相关问题                                                  |
| `getHistoryMessages()`                    | 获取最近 5 条历史（bubble 类型）                              |
| `scrollToBottom(force?)`                  | 近底自动滚动                                                  |
| `onKeyDown(e)`                            | Enter 发送 / Shift+Enter 换行，含 IME 保护                    |
| `getParsedText(markdown)`                 | Markdown 解析 + 链接 target="\_blank"                         |
| `handleInput()`                           | textarea 高度自适应                                           |
| `shakeTextarea()`                         | 空输入时抖动动画                                              |

**新增逻辑**（ChatBot.vue 没有）：

- 建议问题点击 → `sendMessage(text)`
- 流式光标显示/隐藏（基于 `bufferMessage.isBuffering`）
- AI 消息复制按钮 + tooltip

---

## 六、Props / Emits / Expose 接口

```ts
// Props（与 ChatBot.vue 保持一致）
defineProps<{
  bookmarkId?: number
  shareCode?: string
  collection?: { code: string; cbId: number }
  isAppeared?: boolean
  closeButtonHidden?: boolean
}>()

// Emits（与 ChatBot.vue 保持一致）
defineEmits<{
  dismiss: []
  findQuote: [quote: QuoteData]
}>()

// Expose（与 ChatBot.vue 保持一致，useBookmark.ts 的 chatBotQuote 依赖 addQuoteData）
// 注意：defineExpose 需要暴露实际函数实现，不能只写类型签名
defineExpose({
  addQuoteData, // 已在 setup 中定义的函数
  focusTextarea // 已在 setup 中定义的函数
})
```

`botSize()` 不暴露。`useBookmark.ts:14` 当前类型为 `Ref<InstanceType<typeof ChatBot> | undefined>`，施工时需同步改为 duck-typing 接口，避免类型检查卡住：

```ts
// composables/bookmark/useBookmark.ts（施工时同步修改）
interface ChatBotLike {
  addQuoteData: (data: QuoteData) => void
  focusTextarea: () => void
}
// 将 chatbot: Ref<InstanceType<typeof ChatBot> | undefined> 改为：
chatbot: Ref<ChatBotLike | undefined>
```

这样 `SnapshotChatPanel` 和 `ChatBot` 都满足该接口，两个页面的 ref 类型检查均通过。

---

## 七、集成变更

### 7.1 bookmarks/[id].vue

```diff
- import ChatBot from '#layers/core/app/components/Chat/ChatBot.vue'
+ import SnapshotChatPanel from '#layers/core/app/components/Snapshot/SnapshotChatPanel.vue'

- const chatbot = ref<InstanceType<typeof ChatBot>>()
+ const chatbot = ref<InstanceType<typeof SnapshotChatPanel>>()

  <template #chat>
-   <ChatBot v-if="!isSubscriptionExpired" ref="chatbot" :bookmarkId="bmId" :is-appeared="activePanel === 'chat'" @dismiss="activePanel = null" @find-quote="findQuote" />
+   <SnapshotChatPanel v-if="!isSubscriptionExpired" ref="chatbot" :bookmarkId="bmId" :is-appeared="activePanel === 'chat'" @dismiss="activePanel = null" @find-quote="findQuote" />
  </template>
```

### 7.2 s/[id].vue

同上，替换 `<ChatBot>` → `<SnapshotChatPanel>`。

### 7.3 ChatBot.vue

**不删除**，保留原文件（w/sw 页面可能引用，且有完整测试覆盖）。

### 7.4 集成测试同步更新（必须）

`apps/slax-reader-dweb/tests/integration/pages/bookmarks/[id].spec.ts` 中：

- `baseStubs` 里的 `ChatBot` 改为 `SnapshotChatPanel`
- 通过 `findComponent({ name: 'ChatBot' })` 触发 `find-quote` 的用例（如 C32）改为 `findComponent({ name: 'SnapshotChatPanel' })`

`s/[id].vue` 替换后，如需集成测试覆盖，需**新增** `apps/slax-reader-dweb/tests/integration/pages/s/[id].spec.ts`（当前仓库不存在该文件，不需要同步更新不存在的路径）。

**不同步更新 bookmarks/[id].spec.ts 的 stub/断言会导致 `pnpm --filter @apps/slax-reader-dweb test` 失败，施工时必须与组件替换同步完成。**

---

## 八、i18n 新增文案

命名空间：`component.snapshot_chat.*`

| key            | 中文                           | 英文                                                  |
| -------------- | ------------------------------ | ----------------------------------------------------- |
| `suggestion_1` | 这篇文章的核心观点是什么？     | What is the core argument of this article?            |
| `suggestion_2` | 有哪些值得深入了解的概念？     | What concepts are worth exploring further?            |
| `suggestion_3` | 作者的主要论据是什么？         | What are the author's main arguments?                 |
| `empty_title`  | 向 AI 提问，深入理解文章内容   | Ask AI to understand this article                     |
| `empty_desc`   | 或在正文中划选片段直接发起对话 | Or select text in the article to start a conversation |
| `copied`       | 已复制                         | Copied                                                |

---

## 九、新增测试

文件：`apps/slax-reader-dweb/tests/unit/components/Chat/SnapshotChatPanel.spec.ts`

### 9.1 Mock 链路说明

`ChatBot` 类及 `ChatParamsType/ChatResponseType` 通过 Nuxt auto-import 注入，**不能**用普通模块路径 mock（会被 auto-import 绕过）。必须沿用 `ChatBot.spec.ts` 的 `mockNuxtImport` + `vi.hoisted` 模式：

```ts
// 用 hoisted holder 同时捕获构造器回调（capturedCallback）和实例（mockBotInstance）
// 沿用 ChatBot.spec.ts 的 plain function with prototype 模式
// mockUseI18n/mockT 必须放进同一 hoisted holder，否则 mockNuxtImport hoist 后引用 TDZ 报错
const { MockSnapshotChatBot, capturedCallback, mockBotChat, mockBotDestruct, mockBotInstance, mockUseI18n, mockT } = vi.hoisted(() => {
  const captured: { value: ((p: any) => void) | null } = { value: null }
  const instance: { value: any } = { value: null }
  const mockBotChat = vi.fn()
  const mockBotDestruct = vi.fn()
  const mockT = vi.fn((key: string, params?: any) => (params ? `${key}__${JSON.stringify(params)}` : key))

  function MockSnapshotChatBot(this: any, params: any, callback: (p: any) => void) {
    captured.value = callback
    this.params = params
    this.chat = mockBotChat
    this.destruct = mockBotDestruct
    this.chatStatusUpdateHandler = null
    instance.value = this
  }

  return {
    MockSnapshotChatBot: MockSnapshotChatBot as any,
    capturedCallback: captured,
    mockBotChat,
    mockBotDestruct,
    mockBotInstance: instance,
    mockUseI18n: vi.fn(() => ({ locale: { value: 'en' }, t: mockT })),
    mockT
  }
})

mockNuxtImport('ChatBot', () => MockSnapshotChatBot)
mockNuxtImport('ChatResponseType', () => ({ CONTENT: 'CONTENT', FUNCTION: 'FUNCTION', STATUS_UPDATE: 'STATUS_UPDATE' }))
mockNuxtImport('ChatParamsType', () => ({ CONTENT: 'CONTENT', QUESTIONS: 'QUESTIONS', ASK: 'ASK' }))
// useI18n 也是 Nuxt auto-import，必须 mockNuxtImport（不能裸 mount，否则 $t 调用报错）
// 沿用 ChatBot.spec.ts 的 mockUseI18n + mountWithApp 范式
mockNuxtImport('useI18n', () => mockUseI18n)
```

**挂载方式**：必须使用 `mountWithApp`（自动注入 i18n + pinia），不能裸 `mount`：

```ts
import { mountWithApp } from '~~/tests/setup/mount'

const mountPanel = (props: any = {}) =>
  mountWithApp(SnapshotChatPanel, {
    props,
    global: { stubs: { QuestionMessage: true, TipsMessage: true, DotLoading: true } }
  })
```

**beforeEach 必须重置 mock 状态**（防止用例间残留污染）：

```ts
beforeEach(() => {
  // mockReset 同时清调用记录 + 恢复默认实现，防止用例间 mock 实现残留
  // 沿用 request/user spec 的 mockReset().mockReturnValue(...) 范式
  mockBotChat.mockReset()
  mockBotDestruct.mockReset()
  mockUseI18n.mockReset().mockReturnValue({ locale: { value: 'en' }, t: mockT })
  mockT.mockReset().mockImplementation((key: string, params?: any) => (params ? `${key}__${JSON.stringify(params)}` : key))
  capturedCallback.value = null
  mockBotInstance.value = null
  // 用 vi.stubGlobal 替代 Object.defineProperty，afterEach 的 vi.unstubAllGlobals() 会自动还原
  vi.stubGlobal('navigator', {
    ...navigator,
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
  })
  // fake timers（控制 tooltip 1.5s 消失 + focusTextarea 50ms 延迟）
  vi.useFakeTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
```

### 9.2 用例矩阵（共 42 条，按分组对账）

**A. 空态与建议问题（4 条）**

| 用例 | 验证点 |
| --- | --- |
| 空态渲染 | `messageList.length === 0 && !isChatting` 时显示星形图标 + 3 条建议问题胶囊 |
| 建议问题点击 | 点击胶囊 → `mockBotChat()` 被调用，参数满足 `expect.objectContaining({ type: 'CONTENT', content: <对应 i18n 文案> })`；同时 `await nextTick()` 后 `.chat-msg-user` 节点存在且文案等于该 i18n 文案（验证 sendMessage 完整流程，不只是 bot.chat 调用） |
| 建议问题 chatting 防重入 | 先通过 `mockBotInstance.value.chatStatusUpdateHandler(true)` 切到 chatting 状态（此时空态胶囊因 `!isChatting` 条件被隐藏），直接调用 `wrapper.vm.sendMessage?.('问题文案')` 或通过 textarea 输入后触发发送 → `mockBotChat()` **未**被调用（验证 `isChatting` 防重入保护；不依赖空态胶囊可见性） |
| 有消息后空态消失 | `messageList` 非空时 `.chat-empty` 不渲染 |

**B. 构造参数路径（4 条）**（对应 bookmarks/s/collection/无参四条路径，沿用 ChatBot.spec.ts C5-C8 范式）

| 用例            | 验证点                                                                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bookmarkId 路径 | `mount({ bookmarkId: 42 })` → 构造时精确断言 `params` 等于 `{ bookmarkId: 42 }`（不含 shareCode/collection，防止多余字段或错误分支假阳性）              |
| shareCode 路径  | `mount({ shareCode: 'abc' })` → 构造时精确断言 `params` 等于 `{ shareCode: 'abc' }`                                                                     |
| collection 路径 | `mount({ collection: { code: 'c1', cbId: 1 } })` → 构造时精确断言 `params` 等于 `{ collection: { code: 'c1', cbId: 1 } }`                               |
| 无参兜底路径    | `mount({})` → 构造时精确断言 `params` 等于 `{ bookmarkId: 0 }`（兜底 `{ bookmarkId: 0 }`，防止真实 `ChatBot` 构造里 `'bookmarkId' in params` 判断崩溃） |

**C. 引用块（2 条）**

| 用例       | 验证点                                                                               |
| ---------- | ------------------------------------------------------------------------------------ |
| 引用块显示 | `addQuoteData(data)` 后 `.chat-composer-quote` 出现，文案匹配 `data.data[0].content` |
| 引用块关闭 | 点击 ✕ 后 `.chat-composer-quote` 消失                                                |

**D. 输入框与发送（6 条）**

| 用例 | 验证点 |
| --- | --- |
| 发送按钮禁用（空输入） | `inputText === ''` 时发送按钮 `element.disabled === true`（断言原生 disabled 属性，与 `.comment-composer` 规范一致，不断言 class） |
| 发送按钮禁用（chatting） | 先在 textarea 输入非空文本，再通过 `mockBotInstance.value.chatStatusUpdateHandler(true)` 切到 chatting 状态 → 发送按钮 `element.disabled === true`（排除空输入因素，专门验证 chatting 分支） |
| Enter 发送 | 在 textarea 输入 `'test msg'`，keydown Enter（非 IME，非 Shift/Ctrl/Meta）→ `mockBotChat()` 被调用，参数满足 `expect.objectContaining({ type: 'CONTENT', content: 'test msg' })`；`inputText` 清空；`await nextTick()` 后 `.chat-msg-user` 节点存在且文案为 `'test msg'` |
| 带引用发送 | 先 `addQuoteData(quoteData)`，再在 textarea 输入文本发送 → `mockBotChat()` 参数满足 `expect.objectContaining({ quote: quoteData })`；发送后 `.chat-composer-quote` 消失（引用状态被清空） |
| history 拼装（最近 5 条） | 先 seed 6 条已完成 bubble 消息（3 条 user + 3 条 assistant），再发送新消息 → `mockBotChat()` 参数中 `history` 长度为 5（最近 5 条），且 role/content 与 seed 消息一致（验证 `getHistoryMessages()` 截取逻辑） |
| history 拼装（少于 5 条） | seed 2 条 bubble 消息，再发送 → `mockBotChat()` 参数中 `history` 长度为 2（不截断） |

**E. Shift+Enter 与 IME 行为（2 条）**

| 用例 | 验证点 |
| --- | --- |
| Shift+Enter 不发送 | keydown Shift+Enter → `mockBotChat()` **未**被调用；`e.preventDefault()` **未**被调用（依赖 textarea 浏览器默认换行，不断言 inputText 变化） |
| IME 输入中 Enter 不发送 | 先触发 `compositionstart` 事件（`compositionAppear = true`），再 keydown Enter → `mockBotChat()` **未**被调用（IME 组合输入期间 Enter 不触发发送，防止中文/日文输入误发） |

> 注：`onKeyDown` 在 Shift 分支不主动修改 `inputText`，happy-dom 不模拟浏览器默认换行行为，因此只断言"不发送"而非"插入换行"。

**F. SSE 回调 / buffer 流程（18 条）**

> `<script setup>` 组件内部状态不在 `wrapper.vm` 上，**必须通过 DOM `data-*` attribute 或子组件 stub props 断言**。
>
> **渲染路径锁定**：search/browser/searchBookmark loading tips 在 `.chat-msg-ai` 内以 inline 节点渲染，施工时加 `data-tips-type="<name>"` 和 `data-loading="true/false"` attribute 使测试可黑盒观察。`TipsMessage` 只承载 `generateQuestion` 和 `error` 类型。`BubbleMessage` 不在 `mountPanel` stubs 中，不用于断言。
>
> **前置说明**：CONTENT/FUNCTION/finished 用例需先触发 `mockBotInstance.value.chatStatusUpdateHandler(true)` 切到 chatting 状态（模拟真实 `ChatBot.chat()` 的执行顺序），再注入 buffer 或触发目标回调；**processing tips 用例不预置 buffer 也不预置 chatting**（验证空 buffer 时 tips 也能渲染）。

| 用例 | 验证点 |
| --- | --- |
| CONTENT 回调追加 buffer | 先触发 CONTENT 回调建立 buffer → `await nextTick()` → `.chat-msg-ai` 节点存在，且 `.chat-msg-ai-caret` 存在（isBuffering 为 true） |
| chatStatusUpdateHandler false → bufferToMessage | 先注入 CONTENT buffer，再触发 `mockBotInstance.value.chatStatusUpdateHandler(false)` → `await nextTick()` → `.chat-msg-ai-caret` 消失，`.chat-msg-ai-tools` 出现（buffer 已落盘为完成态消息） |
| FUNCTION generateQuestion → 追加 question 消息 | 先切到 chatting，注入 CONTENT buffer，先记录当前 `QuestionMessage` stub 数量 N，触发 FUNCTION generateQuestion 回调 → `await nextTick()` → `QuestionMessage` stub 数量 > N（断言增量）；同时 `wrapper.findAllComponents({ name: 'TipsMessage' })` 中存在 `component.props('tips').tipsType === 'generateQuestion'` 的条目（验证 generateQuestion tips 也被渲染） |
| generateQuestion 点击 → ASK 发送 | 在上一用例基础上，先触发 `chatStatusUpdateHandler(false)` 结束 chatting（`questionClick` 在 `isChatting` 为 true 时直接 return），再通过 `findComponent({ name: 'QuestionMessage' }).vm.$emit('question-click', { rawContent: '问题文案', clickable: true })` 触发 → `mockBotChat()` 被调用，参数满足 `expect.objectContaining({ type: 'ASK', questions: '问题文案' })`（验证 `questionClick` 走 `ChatParamsType.ASK` 而非 `CONTENT`；沿用 ChatBot.spec.ts 的 emit 驱动范式） |
| FUNCTION search → 追加 links 消息 | 先切到 chatting，注入 CONTENT buffer，触发 FUNCTION search 回调（args 含 url/title/content/icon）→ `await nextTick()` → `.chat-msg-ai` 内存在 links 节点（施工时加 `data-content-type="links"` attribute） |
| FUNCTION searchBookmark → 追加 bookmarks 消息 | 先切到 chatting，注入 CONTENT buffer，触发 FUNCTION searchBookmark 回调（args 使用真实后端字段：`[{ bookmark_id: 1, highlight_title: '<mark>标题</mark>', highlight_content: '<mark>内容</mark>' }]`）→ `await nextTick()` → `.chat-msg-ai` 内存在 bookmarks 节点（施工时加 `data-content-type="bookmarks"` attribute），且渲染文案不含 `'No Title'`（验证 `highlight_title` 去 mark 标签后正确映射） |
| FUNCTION relatedQuestion → 追加 related-question | 先切到 chatting，注入 CONTENT buffer，触发 FUNCTION relatedQuestion 回调（args 为问题字符串）→ `await nextTick()` → `QuestionMessage` stub 数量增加（related-question 渲染为可点击问题） |
| relatedQuestion 点击 → ASK 发送 | 在上一用例基础上，先触发 `chatStatusUpdateHandler(false)` 结束 chatting，再通过 `findComponent({ name: 'QuestionMessage' }).vm.$emit('question-click', { content: '相关问题', rawContent: '相关问题' })` 触发 → `mockBotChat()` 被调用，参数满足 `expect.objectContaining({ type: 'ASK', questions: '相关问题' })`（验证 `relatedQuestionClick` 走 `ChatParamsType.ASK`；沿用 ChatBot.spec.ts 的 emit 驱动范式） |
| STATUS_UPDATE processing search → loading tips（空 buffer） | **不预置 buffer**，直接触发 STATUS_UPDATE processing search → `await nextTick()` → `[data-tips-type="search"][data-loading="true"]` 节点存在（验证空 buffer 时 tips 也能渲染） |
| STATUS_UPDATE finished search → loading=false | 先确认 processing 后 `[data-tips-type="search"][data-loading="true"]` 存在，再触发 finished → `await nextTick()` → `[data-tips-type="search"]` 仍存在且 `[data-tips-type="search"][data-loading="true"]` 不存在 |
| STATUS_UPDATE failed search → loading=false | 先确认 processing 后 search loading 节点存在，再触发 `STATUS_UPDATE { name: 'search', status: 'failed' }` → `await nextTick()` → `[data-tips-type="search"][data-loading="true"]` 不存在（`updateTipsSearchStatus(false)` 把 loading 置为 false） |
| STATUS_UPDATE processing browser → loading tips（空 buffer） | **不预置 buffer**，触发 STATUS_UPDATE processing browser → `await nextTick()` → `[data-tips-type="browser"][data-loading="true"]` 节点存在 |
| STATUS_UPDATE finished browser → loading=false | 先确认 processing 后 browser loading 节点存在，再触发 finished → `await nextTick()` → `[data-tips-type="browser"]` 仍存在且 `[data-tips-type="browser"][data-loading="true"]` 不存在 |
| STATUS_UPDATE failed browser → loading=false | 先确认 processing 后 browser loading 节点存在，再触发 `STATUS_UPDATE { name: 'browser', status: 'failed' }` → `await nextTick()` → `[data-tips-type="browser"][data-loading="true"]` 不存在（`updateTipsBrowserStatus(false)` 把 loading 置为 false） |
| STATUS_UPDATE processing searchBookmark → loading tips（空 buffer） | **不预置 buffer**，触发 STATUS_UPDATE processing searchBookmark → `await nextTick()` → `[data-tips-type="searchBookmark"][data-loading="true"]` 节点存在 |
| STATUS_UPDATE finished searchBookmark → loading=false | 先确认 processing 后 searchBookmark loading 节点存在，再触发 finished → `await nextTick()` → `[data-tips-type="searchBookmark"]` 仍存在且 `[data-tips-type="searchBookmark"][data-loading="true"]` 不存在 |
| STATUS_UPDATE failed searchBookmark → loading=false | 先确认 processing 后 searchBookmark loading 节点存在，再触发 `STATUS_UPDATE { name: 'searchBookmark', status: 'failed' }` → `await nextTick()` → `[data-tips-type="searchBookmark"][data-loading="true"]` 不存在（`updateTipsSearchBookmarkStatus(false)` 把 loading 置为 false） |
| STATUS_UPDATE error → 错误消息追加 | 触发 `STATUS_UPDATE { name: 'error', status: 'failed', tips: 'err msg' }` → `await nextTick()` → `wrapper.findAllComponents({ name: 'TipsMessage' })` 中存在 tips prop 满足 `component.props('tips').tipsType === 'error'` 且 `component.props('tips').data === 'err msg'` 的条目 |

**G. 流式光标与复制按钮（3 条）**

> 复制按钮用例需在 `beforeEach` 中 `vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined)` + `vi.useFakeTimers()`；tooltip 断言需 `vi.advanceTimersByTime(1600)` 后验证消失。

| 用例 | 验证点 |
| --- | --- |
| 流式中显示光标 | `bufferMessage.isBuffering === true` 时 `.chat-msg-ai-caret` 存在 |
| 流式完成后光标消失 | `chatStatusUpdateHandler(false)` 后（`isBuffering` 变 false）`.chat-msg-ai-caret` 不存在 |
| 复制按钮点击 | 先注入固定 CONTENT 回调（如 `'hello world'`），触发 `chatStatusUpdateHandler(false)` 落盘；点击 `.chat-msg-ai-tools` 复制按钮 → `navigator.clipboard.writeText` 被调用，且参数等于 `'hello world'`（防止复制空字符串或错误内容假阳性）；`vi.advanceTimersByTime(200)` 后 tooltip 出现；`vi.advanceTimersByTime(1600)` 后 tooltip 消失 |

**H. 暴露接口（2 条）**

> `focusTextarea` 用例需 `vi.useFakeTimers()` + spy `textarea.focus`，调用后 `await nextTick(); vi.advanceTimersByTime(60)` 再断言 focus 被调用。

| 用例                 | 验证点                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `addQuoteData` 暴露  | 通过 `wrapper.vm.addQuoteData(data)` 调用后 `.chat-composer-quote` 出现                                                               |
| `focusTextarea` 暴露 | spy `textarea.focus`；调用 `wrapper.vm.focusTextarea()`；`await nextTick(); vi.advanceTimersByTime(60)` → `textarea.focus` 被调用一次 |

**I. 卸载清理（1 条）**

| 用例 | 验证点 |
| --- | --- |
| onUnmounted 清理 | `wrapper.unmount()` → `mockBotDestruct` 被调用一次；同时施工时需在 `onUnmounted` 中将 `bot.chatStatusUpdateHandler = undefined` 置空（`ChatBot.destruct()` 只清 `responseCallback`，不清 `chatStatusUpdateHandler`，不置空会导致 in-flight stream 在卸载后仍触发状态更新；类型为可选函数，用 `undefined` 而非 `null`）；测试断言：`wrapper.unmount()` 后 `mockBotInstance.value.chatStatusUpdateHandler === undefined` |

**总计：42 条用例**（A:4 + B:4 + C:2 + D:6 + E:2 + F:18 + G:3 + H:2 + I:1）

---

## 十、风险与对策

| 风险                                                       | 对策                                                      |
| ---------------------------------------------------------- | --------------------------------------------------------- |
| `pushBuffer` 逻辑复杂，迁移时引入 bug                      | 迁移后对照 ChatBot.spec.ts 的 buffer 相关用例补写等价测试 |
| 流式光标与 Markdown 渲染冲突（光标被 HTML 截断）           | 光标元素追加在 `.chat-msg-ai` 末尾，不插入 innerHTML 内部 |
| 建议问题 i18n key 在 en.json 缺失                          | 施工时同步补充 zh.json + en.json                          |
| `isAppeared` watch 触发 `focusTextarea` 时 textarea 未挂载 | 复用 ChatBot.vue 的 `nextTick + setTimeout(50ms)` 保护    |

---

## 十一、验收条件

- [ ] 空态：星形图标 + 文案 + 3 条建议问题胶囊正确渲染
- [ ] 建议问题点击后直接发送，消息出现在列表
- [ ] 用户消息右对齐气泡，圆角 `14px 14px 4px 14px`
- [ ] AI 消息流式输出时末尾有闪烁光标，完成后光标消失、复制按钮出现
- [ ] 引用块 `margin-bottom: -12px` 紧贴用户气泡
- [ ] 输入框样式与评论面板一致（上边线、focus 光晕、发送按钮）
- [ ] `addQuoteData` 调用后引用条显示，✕ 可关闭
- [ ] Enter 发送 / Shift+Enter 换行，IME 输入不误触发
- [ ] `pnpm --filter @apps/slax-reader-dweb test` 全部通过（含新增 spec）
- [ ] light / dark / eink 三主题视觉正确
