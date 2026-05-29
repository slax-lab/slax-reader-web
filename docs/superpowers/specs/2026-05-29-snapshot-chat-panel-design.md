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

- `TipsMessage.vue`：搜索/浏览器状态提示
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
- 点击：调用 `sendMessage(t(key))`

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
defineExpose({
  addQuoteData: (data: QuoteData) => void,
  focusTextarea: () => void,
})
```

`botSize()` 不暴露（ChatBot.vue 中有但实际未被外部调用）。

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

文件：`tests/unit/components/Chat/SnapshotChatPanel.spec.ts`

| 用例                 | 验证点                                                   |
| -------------------- | -------------------------------------------------------- |
| 空态渲染             | `messageList.length === 0` 时显示星形图标 + 3 条建议问题 |
| 建议问题点击         | 点击胶囊 → `bot.chat()` 被调用，参数为对应文案           |
| 引用块显示           | `addQuoteData(data)` 后引用条出现                        |
| 引用块关闭           | 点击 ✕ 后引用条消失                                      |
| 发送按钮禁用         | 空输入时 disabled；isChatting 时 disabled                |
| Enter 发送           | keydown Enter（非 IME）触发 sendMessage                  |
| Shift+Enter 换行     | keydown Shift+Enter 插入换行不发送                       |
| `focusTextarea` 暴露 | 调用后 textarea 获得焦点                                 |

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
