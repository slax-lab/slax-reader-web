# SnapshotChatPanel 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新建 `SnapshotChatPanel.vue`，按 snapshot 设计稿（§5.2）实现快照详情页 Chat 面板，核心 SSE/流式逻辑复用 `chatbot.ts` 的 `ChatBot` 类，替换 `bookmarks/[id].vue` 与 `s/[id].vue` 中的旧 `ChatBot.vue`，不破坏现有 `ChatBot.vue` 及其测试。

**Architecture:** 新组件实例化 auto-import 的 `ChatBot` 类处理 SSE，复用 `chatbot.ts` 的消息缓冲/解析逻辑（从 `ChatBot.vue` 迁移），UI 层按 snapshot 重写（空态星形图标 + 建议问题胶囊、用户右气泡、AI 无气泡 + 流式光标 + 复制按钮、输入框复用 `.comment-composer` 规范）。复用 `QuestionMessage`/`TipsMessage`/`DotLoading` 子组件；search/browser/searchBookmark loading tips 在 `.chat-msg-ai` 内 inline 渲染并带 `data-tips-type` / `data-loading` attribute。`useBookmark.ts` 的 `chatbot` ref 类型改为 duck-typing 接口，使新旧组件都满足。

**Tech Stack:** Vue 3 `<script setup>`、Nuxt auto-import、UnoCSS attrify + scoped SCSS、`--slax-*` design tokens、Vitest + happy-dom + `@nuxt/test-utils`（`mockNuxtImport` + `vi.hoisted`）、`mountWithApp`（注入 i18n + pinia）。

**关联设计文档：** `docs/superpowers/specs/2026-05-29-snapshot-chat-panel-design.md`

---

## 文件结构

| 文件                                                                              | 动作 | 职责                                                  |
| --------------------------------------------------------------------------------- | ---- | ----------------------------------------------------- |
| `apps/slax-reader-dweb/layers/core/i18n/locales/zh.json`                          | 修改 | 新增 `component.snapshot_chat.*` 6 条中文文案         |
| `apps/slax-reader-dweb/layers/core/i18n/locales/en.json`                          | 修改 | 新增 `component.snapshot_chat.*` 6 条英文文案         |
| `apps/slax-reader-dweb/layers/core/app/composables/bookmark/useBookmark.ts`       | 修改 | `chatbot` ref 类型改为 `ChatBotLike` duck-typing 接口 |
| `apps/slax-reader-dweb/layers/core/app/components/Snapshot/SnapshotChatPanel.vue` | 新建 | Chat 面板组件（迁移逻辑 + snapshot UI）               |
| `apps/slax-reader-dweb/tests/unit/components/Chat/SnapshotChatPanel.spec.ts`      | 新建 | 42 条单元测试                                         |
| `apps/slax-reader-dweb/layers/core/app/pages/bookmarks/[id].vue`                  | 修改 | `<ChatBot>` → `<SnapshotChatPanel>`                   |
| `apps/slax-reader-dweb/layers/core/app/pages/s/[id].vue`                          | 修改 | `<ChatBot>` → `<SnapshotChatPanel>`                   |
| `apps/slax-reader-dweb/tests/integration/pages/bookmarks/[id].spec.ts`            | 修改 | stub 与断言 `ChatBot` → `SnapshotChatPanel`           |

**保留不动：** `ChatBot.vue`（w/sw 页面依赖 + 有完整测试覆盖）、`chatbot.ts`、`QuestionMessage.vue`、`TipsMessage.vue`、`DotLoading.vue`、`BubbleMessage.vue`。

### 与并行的 AI 面板任务的关系（已对账 commit `1ddef31`）

本计划的基线是 commit `1ddef31`（`feat(dweb): add SnapshotAIPanel ...`，已落在 `feature/snapshot-detail-redesign` 分支）。该 AI 面板任务与本 Chat 任务**改到了相同的几个文件**，但改的是不同区域，互不冲突：

| 文件 | AI 面板已改（不要回退） | 本 Chat 任务改 |
| --- | --- | --- |
| `bookmarks/[id].vue` / `s/[id].vue` | `#ai` slot：`AISummaries` → `SnapshotAIPanel`；移除 `useBookmark` 解构里的 `navigateToText` | `#chat` slot：`ChatBot` → `SnapshotChatPanel`；`chatbot` ref 类型 |
| `en.json` / `zh.json` | 新增 `component.ai_panel`（在 `ai_summaries` 前，字母序） | 新增 `component.snapshot_chat`（在 `share_modal` 后，字母序） |
| `tests/integration/pages/bookmarks/[id].spec.ts` | `baseStubs` 里 `AISummaries` stub → `SnapshotAIPanel` stub | 同 `baseStubs` 里的 `ChatBot` stub → `SnapshotChatPanel` stub |

施工时所有改动按**符号/语义定位**（slot 名、import 符号、stub key、i18n 字母序），不要按固定行号——AI 面板 commit 已使行号偏移。

---

## 验证命令速查

```bash
# 单元测试（单文件）
pnpm --filter @apps/slax-reader-dweb test -- SnapshotChatPanel

# 全量单测
pnpm --filter @apps/slax-reader-dweb test

# 类型检查
pnpm --filter @apps/slax-reader-dweb exec nuxt prepare
pnpm --filter @apps/slax-reader-dweb exec vue-tsc --noEmit -p .

# 格式 + lint（仓库根）
pnpm format:check
pnpm lint

# 手验
pnpm --filter @apps/slax-reader-dweb dev
# http://localhost:3000/bookmarks/<id>  /  http://localhost:3000/s/<shareCode>
```

---

## Task 1: i18n 文案

> **基线说明（已对账 AI 面板 commit `1ddef31`）**：`component` 节点的子键经实测为**严格字母序**（`ai_panel` < `ai_summaries` < ... < `share_modal` < `snapshot_status_modal` ...）。`ai_panel`（AI 面板任务新增）已在 `ai_summaries` 之前。本任务新增的 `snapshot_chat` 应插在 **`share_modal` 之后、`snapshot_status_modal` 之前**，以保持字母序。

**Files:**

- Modify: `apps/slax-reader-dweb/layers/core/i18n/locales/zh.json`（`component` 节点内，`share_modal` 之后插入 `snapshot_chat`）
- Modify: `apps/slax-reader-dweb/layers/core/i18n/locales/en.json`（同结构）

- [ ] **Step 1: 在 zh.json 的 `component` 节点内新增 `snapshot_chat`**

按字母序插在 `"share_modal": { ... }` 块之后、`"snapshot_status_modal": { ... }` 块之前（同级），保持合法 JSON（前一项末尾补逗号）。若不确定精确位置，可先插入再用 `pnpm prettier --write` 让格式器规整；但 prettier **不会**重排 JSON key 顺序，故必须手动放到字母序正确位置：

```json
    "snapshot_chat": {
      "suggestion_1": "这篇文章的核心观点是什么？",
      "suggestion_2": "有哪些值得深入了解的概念？",
      "suggestion_3": "作者的主要论据是什么？",
      "empty_title": "向 AI 提问，深入理解文章内容",
      "empty_desc": "或在正文中划选片段直接发起对话",
      "copied": "已复制"
    },
```

- [ ] **Step 2: 在 en.json 的 `component` 节点内新增同结构 `snapshot_chat`**

```json
    "snapshot_chat": {
      "suggestion_1": "What is the core argument of this article?",
      "suggestion_2": "What concepts are worth exploring further?",
      "suggestion_3": "What are the author's main arguments?",
      "empty_title": "Ask AI to understand this article",
      "empty_desc": "Or select text in the article to start a conversation",
      "copied": "Copied"
    },
```

- [ ] **Step 3: 验证 JSON 合法**

Run: `node -e "JSON.parse(require('fs').readFileSync('apps/slax-reader-dweb/layers/core/i18n/locales/zh.json','utf8')); JSON.parse(require('fs').readFileSync('apps/slax-reader-dweb/layers/core/i18n/locales/en.json','utf8')); console.log('OK')"` Expected: 输出 `OK`（无 JSON 解析错误）

- [ ] **Step 4: 验证 key 存在**

Run: `node -e "const z=require('./apps/slax-reader-dweb/layers/core/i18n/locales/zh.json'); const e=require('./apps/slax-reader-dweb/layers/core/i18n/locales/en.json'); const keys=['suggestion_1','suggestion_2','suggestion_3','empty_title','empty_desc','copied']; for(const k of keys){ if(!z.component.snapshot_chat[k]||!e.component.snapshot_chat[k]) throw new Error('missing '+k); } console.log('ALL KEYS OK')"` Expected: 输出 `ALL KEYS OK`

- [ ] **Step 5: Commit**

```bash
git add apps/slax-reader-dweb/layers/core/i18n/locales/zh.json apps/slax-reader-dweb/layers/core/i18n/locales/en.json
git commit -m "feat(i18n): add snapshot_chat locale keys for SnapshotChatPanel"
```

---

## Task 2: useBookmark 类型改造为 duck-typing 接口

**Files:**

- Modify: `apps/slax-reader-dweb/layers/core/app/composables/bookmark/useBookmark.ts:7,14`

**背景：** `useBookmark.ts:14` 当前 `chatbot: Ref<InstanceType<typeof ChatBot> | undefined>`。替换组件后 `SnapshotChatPanel` 不暴露 `botSize`，类型不兼容。改为 duck-typing 接口（只要求 `addQuoteData` + `focusTextarea`），新旧组件都满足。

- [ ] **Step 1: 移除对 ChatBot 的类型 import，新增 ChatBotLike 接口**

将 `useBookmark.ts` 顶部的：

```ts
import type ChatBot from '#layers/core/app/components/Chat/ChatBot.vue'
import type { QuoteData } from '#layers/core/app/components/Chat/type'
```

改为（删除 `ChatBot` 默认导入，保留 `QuoteData`）：

```ts
import type { QuoteData } from '#layers/core/app/components/Chat/type'
```

在 `interface BookmarkOptions extends CommonBookmarkOptions {` 之前新增接口定义：

```ts
// duck-typing 接口：SnapshotChatPanel 与旧 ChatBot 都满足，避免绑死具体组件类型
interface ChatBotLike {
  addQuoteData: (data: QuoteData) => void
  focusTextarea: () => void
}
```

- [ ] **Step 2: 修改 chatbot 字段类型**

将 `interface BookmarkOptions` 中的：

```ts
chatbot: Ref<InstanceType<typeof ChatBot> | undefined>
```

改为：

```ts
chatbot: Ref<ChatBotLike | undefined>
```

- [ ] **Step 3: 确认 chatBotQuote 仍只用 addQuoteData**

Run: `grep -n "chatbot.value" apps/slax-reader-dweb/layers/core/app/composables/bookmark/useBookmark.ts` Expected: 只出现 `chatbot.value?.addQuoteData(data)`（约第 80 行），无 `botSize` / `focusTextarea` 之外的成员访问。若有其它成员访问，需将其加入 `ChatBotLike` 接口。

- [ ] **Step 4: 类型检查通过**

Run: `pnpm --filter @apps/slax-reader-dweb exec nuxt prepare && pnpm --filter @apps/slax-reader-dweb exec vue-tsc --noEmit -p . 2>&1 | grep -i "useBookmark\|ChatBotLike" || echo "NO TYPE ERROR IN useBookmark"` Expected: 输出 `NO TYPE ERROR IN useBookmark`（useBookmark 相关无类型错误；其它既有 warning 不阻塞）

- [ ] **Step 5: 跑既有 useBookmark 相关测试不回归**

Run: `pnpm --filter @apps/slax-reader-dweb test -- useBookmark 2>&1 | tail -20` Expected: 既有测试通过（若无 useBookmark.spec.ts 则跳过，无新增失败）

- [ ] **Step 6: Commit**

```bash
git add apps/slax-reader-dweb/layers/core/app/composables/bookmark/useBookmark.ts
git commit -m "refactor(bookmark): use ChatBotLike duck-typing for chatbot ref"
```

---

## Task 3: 创建 SnapshotChatPanel.vue 组件

**Files:**

- Create: `apps/slax-reader-dweb/layers/core/app/components/Snapshot/SnapshotChatPanel.vue`

**说明：** 本组件迁移 `ChatBot.vue` 的全部 script 逻辑（见设计文档 §五迁移清单），并按 snapshot §5.2 重写 template + style。逻辑迁移部分**逐字照搬** `ChatBot.vue` 对应函数，仅做下列改动：

1. `sendMessage` 扩展为 `sendMessage(text?: string)`：有参数时用参数替代 `inputText`，但保留 `isChatting` 防重入。
2. 新增建议问题 `SUGGESTIONS` + 点击发送。
3. 新增流式光标（基于 `bufferMessage?.isBuffering`）。
4. 新增 AI 消息复制按钮 + tooltip。
5. search/browser/searchBookmark loading tips 在 `.chat-msg-ai` 内 inline 渲染，带 `data-tips-type` / `data-loading`。
6. `onUnmounted` 中追加 `bot.chatStatusUpdateHandler = undefined`。
7. 移除旧 dark-trigger 图片 hack、移除 close 按钮（由 SidePanel 承担）、移除 `botSize` 暴露。

- [ ] **Step 1: 创建组件文件（完整实现）**

创建 `apps/slax-reader-dweb/layers/core/app/components/Snapshot/SnapshotChatPanel.vue`，内容如下：

```vue
<template>
  <div class="snapshot-chat-panel" ref="chat">
    <!-- 消息流（含空态） -->
    <div class="chat-messages" ref="messages">
      <!-- 空态 -->
      <div v-if="messageList.length === 0 && !isChatting" class="chat-empty">
        <div class="chat-empty-icon">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M12 2l2.4 6.9L21 11l-6.6 2.1L12 20l-2.4-6.9L3 11l6.6-2.1L12 2z" />
          </svg>
        </div>
        <div class="chat-empty-title">{{ $t('component.snapshot_chat.empty_title') }}</div>
        <div class="chat-empty-desc">{{ $t('component.snapshot_chat.empty_desc') }}</div>
        <div class="chat-suggestions">
          <button v-for="key in SUGGESTIONS" :key="key" class="chat-suggestion-pill" @click="sendMessage(t(key))">
            {{ t(key) }}
          </button>
        </div>
      </div>

      <!-- 消息列表 -->
      <template v-for="message in messageList" :key="message.id">
        <!-- 用户消息（右气泡 + 可选引用块） -->
        <template v-if="message.type === 'bubble' && message.direction === 'right'">
          <div v-if="message.quote && message.quote.data.length > 0" class="chat-msg-quote">
            <span v-for="item in message.quote.data" :key="item.content">{{ item.content }}</span>
          </div>
          <div class="chat-msg-user">{{ bubbleText(message) }}</div>
        </template>

        <!-- AI 消息（左对齐无气泡 + 内联 tips/links/bookmarks/related-question + 完成态复制按钮） -->
        <div v-else-if="message.type === 'bubble' && message.direction === 'left'" class="chat-msg-ai">
          <template v-for="(content, ci) in message.contents || []" :key="ci">
            <div v-if="content.type === 'text'" class="chat-msg-ai-text" v-html="content.content"></div>
            <div v-else-if="content.type === 'tips'" class="chat-msg-ai-tip" :data-tips-type="content.tipsType" :data-loading="content.loading ? 'true' : 'false'">
              {{ content.tips }}
            </div>
            <div v-else-if="content.type === 'links'" class="chat-msg-ai-links" data-content-type="links">
              <a v-for="link in content.content" :key="link.url" :href="link.url" target="_blank" rel="noopener">{{ link.title }}</a>
            </div>
            <div v-else-if="content.type === 'bookmarks'" class="chat-msg-ai-bookmarks" data-content-type="bookmarks">
              <div v-for="bm in content.content" :key="bm.bookmark_id" class="chat-msg-ai-bookmark">{{ bm.title }}</div>
            </div>
            <template v-else-if="content.type === 'related-question'">
              <QuestionMessage v-for="(q, qi) in content.questions" :key="qi" :question="toQuestionItem(q)" @question-click="relatedQuestionClick(message, q)" />
            </template>
          </template>
          <span v-if="message.isBuffering" class="chat-msg-ai-caret"></span>
          <div v-else class="chat-msg-ai-tools">
            <button class="chat-copy-btn" @click="copyMessage(message)">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.6">
                <rect x="9" y="9" width="11" height="11" rx="2" />
                <path d="M5 15V5a2 2 0 0 1 2-2h10" />
              </svg>
              <span v-if="copiedId === message.id" class="chat-copied-tip">{{ $t('component.snapshot_chat.copied') }}</span>
            </button>
          </div>
        </div>

        <!-- 建议问题（generateQuestion 产出的独立 question 消息） -->
        <QuestionMessage v-else-if="message.type === 'question'" :question="message" @question-click="questionClick" />

        <!-- 顶层 tips（generateQuestion / error） -->
        <TipsMessage v-else-if="message.type === 'tips'" :tips="message" />
      </template>

      <!-- buffer 流式消息（与 message 列表分开渲染，逻辑同 AI 消息） -->
      <div v-if="bufferMessage" class="chat-msg-ai">
        <template v-for="(content, ci) in bufferMessage.contents || []" :key="ci">
          <div v-if="content.type === 'text'" class="chat-msg-ai-text" v-html="content.content"></div>
          <div v-else-if="content.type === 'tips'" class="chat-msg-ai-tip" :data-tips-type="content.tipsType" :data-loading="content.loading ? 'true' : 'false'">
            {{ content.tips }}
          </div>
          <div v-else-if="content.type === 'links'" class="chat-msg-ai-links" data-content-type="links">
            <a v-for="link in content.content" :key="link.url" :href="link.url" target="_blank" rel="noopener">{{ link.title }}</a>
          </div>
          <div v-else-if="content.type === 'bookmarks'" class="chat-msg-ai-bookmarks" data-content-type="bookmarks">
            <div v-for="bm in content.content" :key="bm.bookmark_id" class="chat-msg-ai-bookmark">{{ bm.title }}</div>
          </div>
          <template v-else-if="content.type === 'related-question'">
            <QuestionMessage v-for="(q, qi) in content.questions" :key="qi" :question="toQuestionItem(q)" @question-click="relatedQuestionClick(bufferMessage, q)" />
          </template>
        </template>
        <span class="chat-msg-ai-caret"></span>
      </div>

      <!-- 加载态（chatting 且无 buffer 时） -->
      <div class="chat-loading" v-if="isChatting && !bufferMessage">
        <DotLoading indicate-color="var(--slax-text-light)" />
      </div>
    </div>

    <!-- 输入区（复用 .comment-composer 规范） -->
    <div class="chat-composer">
      <div class="chat-composer-quote" v-if="quoteInfo && quoteInfo.data.length > 0">
        <div class="chat-composer-quote-text">
          <span v-for="item in quoteInfo.data" :key="item.content">{{ item.content }}</span>
        </div>
        <button class="chat-composer-quote-close" @click="closeQuote" aria-label="cancel quote">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
      <textarea
        ref="textarea"
        v-model="inputText"
        v-on-key-stroke:Enter="[onKeyDown, { eventName: 'keydown' }]"
        :placeholder="textareaPlaceholder"
        @compositionstart="compositionstart"
        @compositionend="compositionend"
        @input="handleInput"
      ></textarea>
      <div class="chat-composer-actions">
        <span class="chat-composer-hint">{{ textareaPlaceholder }}</span>
        <button class="chat-send-btn" :disabled="!sendable" @click="sendMessage()">{{ $t('common.operate.send') }}</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import DotLoading from '#layers/core/app/components/DotLoading.vue'
import QuestionMessage from '#layers/core/app/components/Chat/QuestionMessage.vue'
import TipsMessage from '#layers/core/app/components/Chat/TipsMessage.vue'

import { parseMarkdownText } from '@commons/utils/parse'
import { getUUID } from '@commons/utils/random'
import { vOnKeyStroke } from '@vueuse/components'

import type { ChatBotParams } from '#layers/core/app/utils/chatbot'
import type { BubbleMessageContent, BubbleMessageItem, MessageItem, QuestionMessageItem, QuoteData } from '#layers/core/app/components/Chat/type'

const { t } = useI18n()

const props = defineProps<{
  bookmarkId?: number
  shareCode?: string
  collection?: { code: string; cbId: number }
  isAppeared?: boolean
  closeButtonHidden?: boolean
}>()

const emits = defineEmits<{
  dismiss: []
  findQuote: [quote: QuoteData]
}>()

// 建议问题（硬编码 i18n key）
const SUGGESTIONS = ['component.snapshot_chat.suggestion_1', 'component.snapshot_chat.suggestion_2', 'component.snapshot_chat.suggestion_3']

const botParams: ChatBotParams = (() => {
  if (props.bookmarkId) {
    return { bookmarkId: props.bookmarkId }
  } else if (props.shareCode) {
    return { shareCode: props.shareCode }
  } else if (props.collection) {
    return { collection: props.collection }
  } else {
    return { bookmarkId: 0 }
  }
})()

const bot = new ChatBot(botParams, (params: { type: ChatResponseType; data: ChatResponseData }) => {
  const { type, data } = params
  if (type === ChatResponseType.FUNCTION) {
    if (!data[type]) {
      return
    }
    const { name, args } = data[type]
    if (name === 'generateQuestion' && args) {
      bufferMessage.value = null
      const noQuestionMessage = !messageList.value.find(item => item.type === 'question' || (item.type === 'tips' && item.tipsType === 'generateQuestion'))
      if (noQuestionMessage) {
        messageList.value.push({ id: `tips_generate_question`, type: 'tips', tipsType: 'generateQuestion' })
      }
      messageList.value = messageList.value.concat(
        args.map((item: string) => {
          return { type: 'question', text: getParsedText(item), clickable: true, id: `question_${item}`, isHTML: true, rawContent: item }
        })
      )
      scrollToBottom()
    } else if (name === 'relatedQuestion' && args) {
      pushBuffer({ type: 'related-question', questions: [{ content: args, rawContent: args }] })
    } else if (name === 'search' && args) {
      pushBuffer({ type: 'links', content: args })
    } else if (name === 'searchBookmark' && args) {
      let parsed = []
      if (typeof args === 'string') {
        try {
          const p = JSON.parse(args)
          parsed = Array.isArray(p) ? p : p.data || []
        } catch (e) {
          return
        }
      } else if (Array.isArray(args)) {
        parsed = args
      } else if (args && (args as any).data) {
        parsed = (args as any).data
      }
      if (parsed.length > 0) {
        const bookmarks = parsed.map((item: any) => ({
          title: item.highlight_title?.replace(/<\/?mark>/g, '') || 'No Title',
          content: item.highlight_content?.replace(/<\/?mark>/g, '') || 'No Content',
          bookmark_id: item.bookmark_id
        }))
        pushBuffer({ type: 'bookmarks', content: bookmarks })
      }
    }
  } else if (type === ChatResponseType.CONTENT) {
    pushBuffer({ type: 'text', content: data[type] || '' })
  } else if (type === ChatResponseType.STATUS_UPDATE) {
    if (!data[type]) {
      return
    }
    const { name, tips, status } = data[type]
    if (status === 'processing') {
      if (name === 'generateQuestion') {
        pushBuffer({ type: 'tips', tips: t(`component.chat_bot.generating_question`), loading: true, tipsType: name })
      } else if (name === 'browser') {
        pushBuffer({ type: 'tips', tips: tips ? t('component.chat_bot.{tips}_accessing', { tips }) : t('component.chat_bot.now_accessing'), loading: true, tipsType: name })
      } else if (name === 'search') {
        pushBuffer({ type: 'tips', tips: t('component.chat_bot.{tips}_searching', { tips }), loading: true, tipsType: name })
      } else if (name === 'searchBookmark') {
        pushBuffer({ type: 'tips', tips: t('component.chat_bot.{tips}_searching_bookmark', { tips }), loading: true, tipsType: name })
      }
    } else if (status === 'finished') {
      if (name === 'browser') {
        updateTipsBrowserStatus(true)
      } else if (name === 'search') {
        updateTipsSearchStatus(true)
      } else if (name === 'searchBookmark') {
        updateTipsSearchBookmarkStatus(true)
      } else {
        discardSearch()
      }
    } else if (status === 'failed') {
      if (name === 'browser') {
        updateTipsBrowserStatus(false)
      } else if (name === 'search') {
        updateTipsSearchStatus(false)
      } else if (name === 'searchBookmark') {
        updateTipsSearchBookmarkStatus(false)
      } else if (name === 'error') {
        messageList.value = messageList.value.concat([{ id: `tips_error_${data[type].tips}`, type: 'tips', tipsType: 'error', data: data[type].tips }])
      }
    }
  }
})

bot.chatStatusUpdateHandler = (chatting: boolean) => {
  isChatting.value = chatting
  if (!chatting) {
    const result = bufferToMessage()
    if (result) {
      nextTick(() => scrollToBottom())
    }
  }
}

const isMac = /Mac/i.test(navigator.platform || navigator.userAgent)
const textareaPlaceholder = t('component.chat_bot.{alias}_placeholder', { alias: isMac ? 'cmd' : 'ctrl' })
const compositionAppear = ref(false)
const isInited = ref(false)
const chat = ref<HTMLDivElement>()
const messages = ref<HTMLDivElement>()
const textarea = ref<HTMLTextAreaElement>()
const inputText = ref('')
const isChatting = ref(false)
const messageList = ref<MessageItem[]>([]) as Ref<MessageItem[]>
const bufferMessage = ref<BubbleMessageItem | null>(null) as Ref<BubbleMessageItem | null>
const bufferMarkdownContent = ref('')
const quoteInfo = ref<QuoteData | null>(null) as Ref<QuoteData | null>
const copiedId = ref<string | null>(null)

const sendable = computed(() => inputText.value.trim().length > 0 && !isChatting.value)

const bubbleText = (message: BubbleMessageItem) => {
  return (message.contents || [])
    .filter(c => c.type === 'text')
    .map(c => (c as any).rawContent || (c as any).content)
    .join('\n')
}

const toQuestionItem = (q: { content: string; rawContent?: string }): QuestionMessageItem => ({
  id: `related_${q.rawContent || q.content}`,
  type: 'question',
  text: q.content,
  clickable: true,
  isHTML: true,
  rawContent: q.rawContent
})

watch(
  () => props.isAppeared,
  value => {
    if (value && !isInited.value && !quoteInfo.value) {
      isInited.value = true
      addLog('open')
    } else if (value) {
      addLog('expand')
    }
    if (value) {
      nextTick(() => focusTextarea())
    }
  },
  { flush: 'sync', immediate: true }
)

const addLog = (subAction: 'open' | 'expand' | 'close' | 'collapse') => {
  if (props.bookmarkId) {
    analyticsLog({ event: 'bookmark_chat_interact', sub_action: subAction, entry_point: 'sidebar_entry' })
  }
}

onMounted(() => scrollToBottom())

onUnmounted(() => {
  // ChatBot.destruct() 只清 responseCallback，不清 chatStatusUpdateHandler；
  // 显式置 undefined 防止 in-flight stream 卸载后仍触发状态更新（类型为可选函数）
  bot.chatStatusUpdateHandler = undefined
  bot.destruct()
})

const handleInput = () => {
  if (!textarea.value) {
    return
  }
  textarea.value.style.height = '22px'
  textarea.value.style.height = textarea.value.scrollHeight + 'px'
}

const scrollToBottom = (force?: boolean) => {
  if (!messages.value) {
    return
  }
  const scrollTick = () => {
    nextTick(() => {
      messages.value?.scrollTo({ top: messages.value.scrollHeight, behavior: 'smooth' })
    })
  }
  if (force) {
    scrollTick()
    return
  }
  const isNearBottom = messages.value.scrollHeight - messages.value.scrollTop - messages.value.clientHeight < 200
  if (isNearBottom) {
    scrollTick()
  }
}

// sendMessage 扩展：有 text 参数时用参数文本（建议问题点击），但仍保留 isChatting 防重入
const sendMessage = (text?: string) => {
  const content = (text ?? inputText.value).trim()
  if (isChatting.value || content.length === 0) {
    if (text === undefined) {
      shakeTextarea()
    }
    return
  }
  const history = getHistoryMessages()
  const currentQuote = quoteInfo.value ?? undefined
  messageList.value.push({
    type: 'bubble',
    direction: 'right',
    contents: [{ type: 'text', content }],
    quote: currentQuote,
    id: `bubble_right_${content}_${getUUID()}`
  })
  bot.chat({ type: ChatParamsType.CONTENT, content, history, quote: currentQuote })
  inputText.value = ''
  quoteInfo.value = null
  scrollToBottom()
  nextTick(() => handleInput())
}

const questionClick = (question: QuestionMessageItem) => {
  if (isChatting.value) {
    return
  }
  question.clickable = false
  const questionsRange: number[] = []
  let inQuestionQueue = false
  let findQuestion = false
  for (let i = 0; i < messageList.value.length; i++) {
    const messageItem = messageList.value[i]!
    inQuestionQueue = messageItem.type === 'question'
    if (messageItem === question) {
      findQuestion = true
    }
    if (inQuestionQueue) {
      questionsRange.push(i)
    } else {
      if (findQuestion) {
        break
      } else {
        questionsRange.length = 0
      }
    }
  }
  if (!findQuestion) {
    questionsRange.length = 0
  }
  messageList.value = messageList.value.filter((item, idx) => {
    if (item.type === 'question' && item !== question && item.clickable && questionsRange.includes(idx)) {
      return false
    }
    return true
  })
  if (!question.rawContent) {
    return
  }
  bot.chat({ type: ChatParamsType.ASK, questions: question.rawContent })
}

const relatedQuestionClick = (message: BubbleMessageItem | null, question: { content: string; rawContent?: string }) => {
  if (isChatting.value || !message) {
    return
  }
  const index = messageList.value.findIndex(item => item === message)
  if (index !== -1) {
    messageList.value.splice(index, 1)
  }
  messageList.value.push({
    id: `question_${question.rawContent}`,
    type: 'question',
    text: question.content,
    clickable: false,
    isHTML: true,
    rawContent: question.rawContent
  })
  bot.chat({ type: ChatParamsType.ASK, questions: question.content })
}

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key !== 'Enter' || compositionAppear.value) {
    return
  }
  const commonPreLineKey = e.ctrlKey || e.shiftKey
  if ((commonPreLineKey && !isMac) || ((commonPreLineKey || e.metaKey) && isMac)) {
    if (!e.target || !(e.target instanceof HTMLTextAreaElement)) {
      return
    }
    const textareaTarget = e.target as HTMLTextAreaElement
    const cursorPosition = textareaTarget.selectionStart
    const textBeforeCursor = inputText.value.slice(0, cursorPosition)
    const textAfterCursor = inputText.value.slice(cursorPosition)
    !e.shiftKey && (inputText.value = textBeforeCursor + '\n' + textAfterCursor)
    nextTick(() => {
      textareaTarget.selectionStart = cursorPosition + 1
      textareaTarget.selectionEnd = cursorPosition + 1
      handleInput()
    })
  } else {
    sendMessage()
    e.preventDefault()
  }
}

const pushBuffer = (content: BubbleMessageContent) => {
  if (!bufferMessage.value) {
    bufferMessage.value = { type: 'bubble', direction: 'left', contents: [], isBuffering: true, id: `bubble_buffer` }
  }
  if (!bufferMessage.value.contents) {
    bufferMessage.value.contents = []
  }
  const contents = bufferMessage.value.contents
  if (content.type === 'links' || content.type === 'tips' || content.type === 'bookmarks') {
    contents.push(content)
    bufferMarkdownContent.value = ''
  } else if (content.type === 'related-question') {
    if (bufferMessage.value && bufferMessage.value.contents && bufferMessage.value.contents.length > 0 && bufferMessage.value.contents[0]!.type !== 'related-question') {
      bufferToMessage()
      bufferMessage.value = { type: 'bubble', direction: 'left', contents: [] as BubbleMessageContent[], isBuffering: true, id: `bubble_buffer` }
    }
    const newBufferMessageContents = bufferMessage.value.contents
    if (newBufferMessageContents?.length === 0) {
      newBufferMessageContents.push(content)
    } else {
      const lastContent = newBufferMessageContents?.[newBufferMessageContents.length - 1]
      if (content.type !== lastContent?.type) {
        newBufferMessageContents?.push(content)
      } else {
        lastContent.questions = lastContent.questions.concat(content.questions)
      }
    }
    bufferMarkdownContent.value = ''
  } else {
    if (contents.length === 0) {
      if (content.type === 'text') {
        bufferMarkdownContent.value = content.content
        content.content = getParsedText(bufferMarkdownContent.value)
        content.rawContent = bufferMarkdownContent.value
        content.isHTML = true
      }
      contents.push(content)
    } else {
      const lastContent = contents[contents.length - 1]!
      if (content.type !== lastContent.type) {
        if (content.type === 'text') {
          bufferMarkdownContent.value = content.content
          content.content = getParsedText(bufferMarkdownContent.value)
          content.rawContent = bufferMarkdownContent.value
          content.isHTML = true
        }
        contents.push(content)
      } else if (content.type === 'text' && lastContent.type === 'text') {
        bufferMarkdownContent.value += content.content
        lastContent.content = getParsedText(bufferMarkdownContent.value)
        lastContent.rawContent = bufferMarkdownContent.value
      }
    }
  }
  const isSearchOrBrowserTips = (item: BubbleMessageContent): boolean => item.type === 'tips' && (item.tipsType === 'search' || item.tipsType === 'browser')
  const shouldKeepContent = (item: BubbleMessageContent): boolean => item.type !== 'tips' || !isSearchOrBrowserTips(item)
  if (content.type !== 'tips' || !isSearchOrBrowserTips(content)) {
    bufferMessage.value.contents = bufferMessage.value.contents?.filter(shouldKeepContent)
  }
  scrollToBottom()
}

const bufferToMessage = () => {
  bufferMarkdownContent.value = ''
  if (bufferMessage.value && (bufferMessage.value.contents || []).length > 0) {
    bufferMessage.value.isBuffering = false
    bufferMessage.value.id = `bubble_${getUUID()}_${new Date().getTime()}`
    messageList.value.push(bufferMessage.value)
    bufferMessage.value = null
    discardSearch()
    return true
  }
  return false
}

const updateTipsSearchStatus = (success: boolean) => {
  const searchMessage = bufferMessage.value?.contents?.find(content => content.type === 'tips' && content.tipsType === 'search' && content.loading)
  if (!searchMessage || searchMessage.type !== 'tips') {
    return
  }
  const tipsText = success ? t('component.chat_bot.search_complete') : t('component.chat_bot.search_failed')
  const reg = new RegExp(`${t('component.chat_bot.searching_token')}\\.\\.\\.$`)
  searchMessage.tips = searchMessage.tips.replace(reg, tipsText)
  searchMessage.loading = false
}

const updateTipsSearchBookmarkStatus = (success: boolean) => {
  const searchMessage = bufferMessage.value?.contents?.find(content => content.type === 'tips' && content.tipsType === 'searchBookmark' && content.loading)
  if (!searchMessage || searchMessage.type !== 'tips') {
    return
  }
  const tipsText = success ? t('component.chat_bot.search_bookmark_complete') : t('component.chat_bot.search_bookmark_failed')
  const reg = new RegExp('搜索资料库\\.\\.\\.$')
  searchMessage.tips = searchMessage.tips.replace(reg, tipsText)
  searchMessage.loading = false
}

const updateTipsBrowserStatus = (success: boolean) => {
  const browerMessage = bufferMessage.value?.contents?.find(content => content.type === 'tips' && content.tipsType === 'browser' && content.loading)
  if (!browerMessage || browerMessage.type !== 'tips') {
    return
  }
  const tipsText = success ? t('component.chat_bot.access_complete') : t('component.chat_bot.access_failed')
  if (browerMessage.tips === t('component.chat_bot.now_accessing')) {
    browerMessage.tips = tipsText
  } else {
    const reg = new RegExp(`${t('component.chat_bot.accessing_token')}\\.\\.\\.$`)
    browerMessage.tips = browerMessage.tips.replace(reg, tipsText)
  }
  browerMessage.loading = false
}

const discardSearch = () => {
  if (!bufferMessage.value || !bufferMessage.value.contents || bufferMessage.value.contents.length === 0) {
    return
  }
  bufferMessage.value.contents = bufferMessage.value.contents.filter(item => item.type !== 'tips' || (item.type === 'tips' && !item.loading))
}

const getHistoryMessages = () => {
  const history = messageList.value
    .filter(data => data.type === 'bubble')
    .map(data => {
      const content =
        (data as BubbleMessageItem).contents
          ?.filter(c => c.type === 'text')
          .map(c => (c as any).rawContent || (c as any).content)
          .join('\n') || ''
      return { role: (data as BubbleMessageItem).direction === 'left' ? 'assistant' : 'user', content }
    })
    .filter(data => data.content.length > 0) as { role: 'assistant' | 'user'; content: string }[]
  if (history.length > 5) {
    history.reverse()
    history.length = 5
    history.reverse()
  }
  return history
}

const compositionstart = () => {
  compositionAppear.value = true
}

const compositionend = () => {
  compositionAppear.value = false
}

const shakeTextarea = () => {
  if (!textarea.value) {
    return
  }
  textarea.value.classList.add('shake')
  textarea.value.addEventListener('animationend', () => textarea.value?.classList.remove('shake'), { once: true })
}

const getParsedText = (markdownText: string) => {
  return parseMarkdownText(markdownText).replace(/<a/g, '<a target="_blank"') || ''
}

const addQuoteData = (data: QuoteData) => {
  quoteInfo.value = data
  nextTick(() => scrollToBottom(true))
}

const focusTextarea = () => {
  nextTick(() => {
    if (textarea.value) {
      textarea.value.blur()
      setTimeout(() => textarea.value?.focus(), 50)
    }
  })
}

const closeQuote = () => {
  quoteInfo.value = null
}

const copyMessage = async (message: BubbleMessageItem) => {
  const text = (message.contents || [])
    .filter(c => c.type === 'text')
    .map(c => (c as any).rawContent || (c as any).content)
    .join('\n')
  await navigator.clipboard.writeText(text)
  copiedId.value = message.id
  setTimeout(() => {
    if (copiedId.value === message.id) {
      copiedId.value = null
    }
  }, 1500)
}

defineExpose({ addQuoteData, focusTextarea })
</script>

<style lang="scss" scoped>
.snapshot-chat-panel {
  --style: w-full h-full flex flex-col overflow-hidden;
  background: var(--slax-surface-solid);

  .chat-messages {
    --style: flex-1 w-full overflow-y-auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 20px 16px;
    overscroll-behavior: contain;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }

  // 空态
  .chat-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding-top: 72px;

    .chat-empty-icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--slax-accent-bg);
      color: var(--slax-accent);
      margin-bottom: 16px;
    }

    .chat-empty-title {
      font-size: 13px;
      color: var(--slax-text-muted);
      line-height: 1.6;
    }

    .chat-empty-desc {
      font-size: 13px;
      color: var(--slax-text-muted);
      line-height: 1.6;
      margin-bottom: 20px;
    }

    .chat-suggestions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;

      .chat-suggestion-pill {
        font-size: 12px;
        color: var(--slax-text-muted);
        background: var(--slax-bg);
        border: 1px solid var(--slax-border);
        border-radius: 999px;
        padding: 6px 14px;
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
          color: var(--slax-accent);
          border-color: color-mix(in srgb, var(--slax-accent) 40%, var(--slax-border));
          background: var(--slax-accent-bg);
        }
      }
    }
  }

  // 用户消息
  .chat-msg-user {
    align-self: flex-end;
    max-width: 85%;
    background: color-mix(in srgb, var(--slax-text) 7%, var(--slax-surface));
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-wrap;
    border-radius: 14px 14px 4px 14px;
    padding: 10px 14px;
    color: var(--slax-text);
  }

  // 引用块（用户消息上方）
  .chat-msg-quote {
    align-self: flex-end;
    max-width: 85%;
    border-left: 3px solid var(--slax-accent);
    background: var(--slax-accent-bg);
    font-size: 12px;
    color: var(--slax-text-muted);
    line-height: 1.55;
    padding: 6px 10px 6px 12px;
    margin-bottom: -12px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  // AI 消息
  .chat-msg-ai {
    align-self: flex-start;
    max-width: 100%;
    font-size: 14px;
    line-height: 1.75;
    color: var(--slax-text);

    .chat-msg-ai-text {
      white-space: pre-wrap;

      :deep(a) {
        color: var(--slax-accent);
      }
    }

    .chat-msg-ai-tip {
      font-size: 12px;
      color: var(--slax-text-light);
      margin: 4px 0;

      &[data-loading='true']::after {
        content: '...';
      }
    }

    .chat-msg-ai-links,
    .chat-msg-ai-bookmarks {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin: 8px 0;

      a,
      .chat-msg-ai-bookmark {
        font-size: 13px;
        color: var(--slax-accent);
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

    .chat-msg-ai-tools {
      margin-top: 6px;

      .chat-copy-btn {
        position: relative;
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        color: var(--slax-text-light);
        cursor: pointer;
        transition: all 0.15s;

        &:hover {
          color: var(--slax-accent);
          background: var(--slax-accent-bg);
        }

        .chat-copied-tip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          font-size: 11px;
          color: var(--slax-accent);
          background: var(--slax-accent-bg);
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
        }
      }
    }
  }

  .chat-loading {
    --style: w-full flex-center py-2;
  }

  // 输入区（复用 .comment-composer 规范）
  .chat-composer {
    flex-shrink: 0;
    background: var(--slax-bg);
    border-top: 1px solid var(--slax-border);
    padding: 14px 16px;
    box-shadow: 0 -8px 16px -8px color-mix(in srgb, var(--slax-accent) 6%, transparent);
    transition:
      border-color 0.15s,
      box-shadow 0.15s;

    &:focus-within {
      border-top-color: color-mix(in srgb, var(--slax-accent) 35%, transparent);
      box-shadow: 0 -8px 16px -8px color-mix(in srgb, var(--slax-accent) 10%, transparent);
    }

    .chat-composer-quote {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-left: 3px solid var(--slax-accent);
      background: var(--slax-accent-bg);
      padding: 6px 8px 6px 10px;
      margin-bottom: 10px;
      border-radius: 0 4px 4px 0;

      .chat-composer-quote-text {
        font-size: 12px;
        color: var(--slax-text-muted);
        line-height: 1.55;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .chat-composer-quote-close {
        flex-shrink: 0;
        margin-left: 8px;
        color: var(--slax-text-light);
        cursor: pointer;

        &:hover {
          color: var(--slax-text);
        }
      }
    }

    textarea {
      width: 100%;
      min-height: 40px;
      max-height: 120px;
      resize: none;
      border: none;
      background: transparent;
      color: var(--slax-text);
      font-size: 13px;
      font-family: inherit;
      line-height: 1.6;
      outline: none;

      &::placeholder {
        color: var(--slax-text-light);
      }
    }

    .chat-composer-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 8px;

      .chat-composer-hint {
        font-size: 11px;
        font-weight: 300;
        color: var(--slax-text-light);
      }

      .chat-send-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 6px 16px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.15s;
        background: var(--slax-accent);
        color: var(--slax-btn-text, #fff);

        &:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        &:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px color-mix(in srgb, var(--slax-accent) 20%, transparent);
        }
      }
    }
  }
}

@keyframes chatCaretBlink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  20%,
  60% {
    transform: translateX(-2px);
  }
  40%,
  80% {
    transform: translateX(2px);
  }
}

// eslint-disable-next-line vue-scoped-css/no-unused-selector
textarea.shake {
  animation: shake 0.5s;
}
</style>
```

- [ ] **Step 2: 类型检查通过**

Run: `pnpm --filter @apps/slax-reader-dweb exec nuxt prepare && pnpm --filter @apps/slax-reader-dweb exec vue-tsc --noEmit -p . 2>&1 | grep -i "SnapshotChatPanel" || echo "NO TYPE ERROR IN SnapshotChatPanel"` Expected: 输出 `NO TYPE ERROR IN SnapshotChatPanel`

- [ ] **Step 3: lint + format 通过**

Run: `pnpm prettier --write apps/slax-reader-dweb/layers/core/app/components/Snapshot/SnapshotChatPanel.vue && pnpm --filter @apps/slax-reader-dweb exec eslint apps/slax-reader-dweb/layers/core/app/components/Snapshot/SnapshotChatPanel.vue 2>&1 | grep -i "error" || echo "NO LINT ERROR"` Expected: 输出 `NO LINT ERROR`（warning 不阻塞）

- [ ] **Step 4: Commit**

```bash
git add apps/slax-reader-dweb/layers/core/app/components/Snapshot/SnapshotChatPanel.vue
git commit -m "feat(snapshot): add SnapshotChatPanel component"
```

---

## Task 4: SnapshotChatPanel 单元测试（42 条）

**Files:**

- Create: `apps/slax-reader-dweb/tests/unit/components/Chat/SnapshotChatPanel.spec.ts`

**说明：** 严格按设计文档 §9 实现。Mock 链路用 `mockNuxtImport` + `vi.hoisted`（见设计文档 §9.1 代码块）。挂载用 `mountWithApp`。42 条用例分 A-I 9 组。

> **执行提示（TDD）：** 本任务测试覆盖的是 Task 3 已实现的组件。先把测试写全并运行，对每条失败用例回到 Task 3 组件修正——若组件已正确实现，测试应直接通过。本任务的"失败→修正"循环以组件为被测对象。

- [ ] **Step 1: 创建测试文件骨架 + Mock 链路 + beforeEach/afterEach**

创建 `apps/slax-reader-dweb/tests/unit/components/Chat/SnapshotChatPanel.spec.ts`，顶部按设计文档 §9.1 写入 `vi.hoisted` holder（`MockSnapshotChatBot` / `capturedCallback` / `mockBotChat` / `mockBotDestruct` / `mockBotInstance` / `mockUseI18n` / `mockT`）、`mockNuxtImport('ChatBot'/'ChatResponseType'/'ChatParamsType'/'useI18n')`、`vi.mock('@commons/utils/parse')` + `vi.mock('@commons/utils/random')`（参考 ChatBot.spec.ts），`import SnapshotChatPanel`、`mountPanel` helper（stubs: `QuestionMessage: true, TipsMessage: true, DotLoading: true`）、`beforeEach`/`afterEach`（按 §9.1 的 mockReset + stubGlobal navigator.clipboard + useFakeTimers）。

```ts
import { nextTick } from 'vue'

import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { mountWithApp } from '~~/tests/setup/mount'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { MockSnapshotChatBot, capturedCallback, mockBotChat, mockBotDestruct, mockBotInstance, mockUseI18n, mockT, mockAnalyticsLog, mockParseMarkdownText, mockGetUUID } =
  vi.hoisted(() => {
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
      mockT,
      mockAnalyticsLog: vi.fn(),
      mockParseMarkdownText: vi.fn((s: string) => s),
      mockGetUUID: vi.fn(() => 'test-uuid')
    }
  })

mockNuxtImport('ChatBot', () => MockSnapshotChatBot)
mockNuxtImport('ChatResponseType', () => ({ CONTENT: 'CONTENT', FUNCTION: 'FUNCTION', STATUS_UPDATE: 'STATUS_UPDATE' }))
mockNuxtImport('ChatParamsType', () => ({ CONTENT: 'CONTENT', QUESTIONS: 'QUESTIONS', ASK: 'ASK' }))
mockNuxtImport('useI18n', () => mockUseI18n)
mockNuxtImport('analyticsLog', () => mockAnalyticsLog)

vi.mock('@commons/utils/parse', () => ({ parseMarkdownText: mockParseMarkdownText }))
vi.mock('@commons/utils/random', () => ({ getUUID: mockGetUUID }))

import SnapshotChatPanel from '~~/layers/core/app/components/Snapshot/SnapshotChatPanel.vue'

const mountPanel = (props: any = {}) =>
  mountWithApp(SnapshotChatPanel, {
    props,
    global: { stubs: { QuestionMessage: true, TipsMessage: true, DotLoading: true } }
  })

// 触发 SSE 回调的辅助
const emit = (payload: any) => capturedCallback.value!(payload)
const setChatting = (v: boolean) => mockBotInstance.value.chatStatusUpdateHandler(v)

describe('SnapshotChatPanel.vue', () => {
  beforeEach(() => {
    mockBotChat.mockReset()
    mockBotDestruct.mockReset()
    mockUseI18n.mockReset().mockReturnValue({ locale: { value: 'en' }, t: mockT })
    mockT.mockReset().mockImplementation((key: string, params?: any) => (params ? `${key}__${JSON.stringify(params)}` : key))
    mockAnalyticsLog.mockReset()
    mockParseMarkdownText.mockReset().mockImplementation((s: string) => s)
    capturedCallback.value = null
    mockBotInstance.value = null
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  // A-I 组用例在后续 Step 追加
})
```

- [ ] **Step 2: 运行骨架确认 Mock 链路可加载**

Run: `pnpm --filter @apps/slax-reader-dweb test -- SnapshotChatPanel 2>&1 | tail -15` Expected: 测试文件能加载、`mountPanel({ bookmarkId: 1 })` 不抛错（此时 describe 内无 it，vitest 提示 no tests 或通过；关键是无 import/TDZ 报错）

- [ ] **Step 3: 实现 A 组（空态与建议问题，4 条）**

在 describe 内追加：

```ts
describe('A. 空态与建议问题', () => {
  it('A1: 空态渲染星形图标 + 3 条建议问题胶囊', () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    expect(wrapper.find('.chat-empty-icon').exists()).toBe(true)
    expect(wrapper.findAll('.chat-suggestion-pill').length).toBe(3)
  })

  it('A2: 建议问题点击 → bot.chat(CONTENT) + 用户气泡出现', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    const firstKey = 'component.snapshot_chat.suggestion_1'
    await wrapper.findAll('.chat-suggestion-pill')[0]!.trigger('click')
    expect(mockBotChat).toHaveBeenCalledWith(expect.objectContaining({ type: 'CONTENT', content: firstKey }))
    await nextTick()
    const user = wrapper.find('.chat-msg-user')
    expect(user.exists()).toBe(true)
    expect(user.text()).toBe(firstKey)
  })

  it('A3: chatting 中点击建议问题不发送（防重入）', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    setChatting(true)
    await nextTick()
    // chatting 时空态胶囊隐藏，直接走发送路径仍应被 isChatting 拦截
    const textarea = wrapper.find('textarea')
    await textarea.setValue('hi')
    await textarea.trigger('keydown', { key: 'Enter' })
    expect(mockBotChat).not.toHaveBeenCalled()
  })

  it('A4: 有消息后空态消失', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    await wrapper.findAll('.chat-suggestion-pill')[0]!.trigger('click')
    await nextTick()
    expect(wrapper.find('.chat-empty').exists()).toBe(false)
  })
})
```

- [ ] **Step 4: 运行 A 组**

Run: `pnpm --filter @apps/slax-reader-dweb test -- SnapshotChatPanel 2>&1 | tail -20` Expected: A1-A4 PASS（若失败，回 Task 3 修正组件）

- [ ] **Step 5: 实现 B 组（构造参数路径，4 条）**

```ts
describe('B. 构造参数路径', () => {
  it('B1: bookmarkId 路径', () => {
    mountPanel({ bookmarkId: 42 })
    expect(mockBotInstance.value.params).toEqual({ bookmarkId: 42 })
  })
  it('B2: shareCode 路径', () => {
    mountPanel({ shareCode: 'abc' })
    expect(mockBotInstance.value.params).toEqual({ shareCode: 'abc' })
  })
  it('B3: collection 路径', () => {
    mountPanel({ collection: { code: 'c1', cbId: 1 } })
    expect(mockBotInstance.value.params).toEqual({ collection: { code: 'c1', cbId: 1 } })
  })
  it('B4: 无参兜底 { bookmarkId: 0 }', () => {
    mountPanel({})
    expect(mockBotInstance.value.params).toEqual({ bookmarkId: 0 })
  })
})
```

- [ ] **Step 6: 运行 B 组**

Run: `pnpm --filter @apps/slax-reader-dweb test -- SnapshotChatPanel 2>&1 | tail -20` Expected: B1-B4 PASS

- [ ] **Step 7: 实现 C 组（引用块，2 条）**

```ts
describe('C. 引用块', () => {
  const quote = { source: {}, data: [{ type: 'text' as const, content: '引用片段' }] }
  it('C1: addQuoteData 后引用条出现', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    ;(wrapper.vm as any).addQuoteData(quote)
    await nextTick()
    const q = wrapper.find('.chat-composer-quote')
    expect(q.exists()).toBe(true)
    expect(q.text()).toContain('引用片段')
  })
  it('C2: 点击 ✕ 后引用条消失', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    ;(wrapper.vm as any).addQuoteData(quote)
    await nextTick()
    await wrapper.find('.chat-composer-quote-close').trigger('click')
    await nextTick()
    expect(wrapper.find('.chat-composer-quote').exists()).toBe(false)
  })
})
```

- [ ] **Step 8: 运行 C 组**

Run: `pnpm --filter @apps/slax-reader-dweb test -- SnapshotChatPanel 2>&1 | tail -20` Expected: C1-C2 PASS

- [ ] **Step 9: 实现 D 组（输入框与发送，6 条）**

```ts
describe('D. 输入框与发送', () => {
  it('D1: 空输入时发送按钮 disabled', () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    expect((wrapper.find('.chat-send-btn').element as HTMLButtonElement).disabled).toBe(true)
  })
  it('D2: chatting 时发送按钮 disabled（非空输入）', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    await wrapper.find('textarea').setValue('hello')
    setChatting(true)
    await nextTick()
    expect((wrapper.find('.chat-send-btn').element as HTMLButtonElement).disabled).toBe(true)
  })
  it('D3: Enter 发送 → bot.chat(CONTENT) + 清空 + 用户气泡', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    const ta = wrapper.find('textarea')
    await ta.setValue('test msg')
    await ta.trigger('keydown', { key: 'Enter' })
    expect(mockBotChat).toHaveBeenCalledWith(expect.objectContaining({ type: 'CONTENT', content: 'test msg' }))
    await nextTick()
    expect((ta.element as HTMLTextAreaElement).value === '' || (wrapper.vm as any).inputText === undefined).toBeTruthy()
    expect(wrapper.find('.chat-msg-user').text()).toBe('test msg')
  })
  it('D4: 带引用发送 → quote 进入 bot.chat 且引用清空', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    const quote = { source: {}, data: [{ type: 'text' as const, content: 'q' }] }
    ;(wrapper.vm as any).addQuoteData(quote)
    await nextTick()
    const ta = wrapper.find('textarea')
    await ta.setValue('ask')
    await ta.trigger('keydown', { key: 'Enter' })
    expect(mockBotChat).toHaveBeenCalledWith(expect.objectContaining({ quote }))
    await nextTick()
    expect(wrapper.find('.chat-composer-quote').exists()).toBe(false)
  })
  it('D5: history 最近 5 条截取', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    // seed 6 条已完成 bubble：交替 user / assistant（通过 CONTENT + finish 制造 assistant，通过发送制造 user）
    // 简化：直接操作 vm.messageList（script setup 不暴露则改用交互式构造）
    // 这里用交互方式：发送 3 轮（每轮 user + assistant）
    for (let i = 0; i < 3; i++) {
      const ta = wrapper.find('textarea')
      await ta.setValue(`u${i}`)
      await ta.trigger('keydown', { key: 'Enter' })
      emit({ type: 'CONTENT', data: { CONTENT: `a${i}` } })
      setChatting(false)
      await nextTick()
    }
    mockBotChat.mockClear()
    const ta = wrapper.find('textarea')
    await ta.setValue('newest')
    await ta.trigger('keydown', { key: 'Enter' })
    const arg = mockBotChat.mock.calls.at(-1)![0]
    expect(arg.history.length).toBe(5)
  })
  it('D6: history 少于 5 条不截断', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    const ta = wrapper.find('textarea')
    await ta.setValue('u0')
    await ta.trigger('keydown', { key: 'Enter' })
    emit({ type: 'CONTENT', data: { CONTENT: 'a0' } })
    setChatting(false)
    await nextTick()
    mockBotChat.mockClear()
    await ta.setValue('u1')
    await ta.trigger('keydown', { key: 'Enter' })
    const arg = mockBotChat.mock.calls.at(-1)![0]
    expect(arg.history.length).toBe(2)
  })
})
```

> **施工注意（D5/D6）：** `history` 拼装依赖 `getHistoryMessages()` 读 `messageList` 中 `bubble` 消息。assistant bubble 通过 `emit CONTENT` + `setChatting(false)` 触发 `bufferToMessage()` 落盘产生。若发现 mockParseMarkdownText 把内容改写导致 content 为空，确认 `mockParseMarkdownText` 返回原文（beforeEach 已设 `(s) => s`）。

- [ ] **Step 10: 运行 D 组**

Run: `pnpm --filter @apps/slax-reader-dweb test -- SnapshotChatPanel 2>&1 | tail -25` Expected: D1-D6 PASS

- [ ] **Step 11: 实现 E 组（Shift+Enter 与 IME，2 条）**

```ts
describe('E. Shift+Enter 与 IME', () => {
  it('E1: Shift+Enter 不发送', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    const ta = wrapper.find('textarea')
    await ta.setValue('line')
    await ta.trigger('keydown', { key: 'Enter', shiftKey: true })
    expect(mockBotChat).not.toHaveBeenCalled()
  })
  it('E2: IME 组合输入中 Enter 不发送', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    const ta = wrapper.find('textarea')
    await ta.setValue('中文')
    await ta.trigger('compositionstart')
    await ta.trigger('keydown', { key: 'Enter' })
    expect(mockBotChat).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 12: 运行 E 组**

Run: `pnpm --filter @apps/slax-reader-dweb test -- SnapshotChatPanel 2>&1 | tail -20` Expected: E1-E2 PASS

- [ ] **Step 13: 实现 F 组（SSE 回调 / buffer，18 条）**

```ts
describe('F. SSE 回调 / buffer', () => {
  const seedBuffer = () => {
    setChatting(true)
    emit({ type: 'CONTENT', data: { CONTENT: 'x' } })
  }

  it('F1: CONTENT 建立 buffer → .chat-msg-ai + caret', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    seedBuffer()
    await nextTick()
    expect(wrapper.find('.chat-msg-ai').exists()).toBe(true)
    expect(wrapper.find('.chat-msg-ai-caret').exists()).toBe(true)
  })
  it('F2: chatStatusUpdateHandler(false) → buffer 落盘，caret 消失 tools 出现', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    seedBuffer()
    setChatting(false)
    await nextTick()
    expect(wrapper.find('.chat-msg-ai-caret').exists()).toBe(false)
    expect(wrapper.find('.chat-msg-ai-tools').exists()).toBe(true)
  })
  it('F3: FUNCTION generateQuestion → question 数量增加 + generateQuestion tips', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    seedBuffer()
    await nextTick()
    const before = wrapper.findAllComponents({ name: 'QuestionMessage' }).length
    emit({ type: 'FUNCTION', data: { FUNCTION: { name: 'generateQuestion', args: ['Q1', 'Q2'] } } })
    await nextTick()
    expect(wrapper.findAllComponents({ name: 'QuestionMessage' }).length).toBeGreaterThan(before)
    const tips = wrapper.findAllComponents({ name: 'TipsMessage' })
    expect(tips.some(c => (c.props('tips') as any).tipsType === 'generateQuestion')).toBe(true)
  })
  it('F4: generateQuestion 点击 → ASK 发送', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    seedBuffer()
    emit({ type: 'FUNCTION', data: { FUNCTION: { name: 'generateQuestion', args: ['Q1'] } } })
    setChatting(false)
    await nextTick()
    const q = wrapper.findAllComponents({ name: 'QuestionMessage' }).find(c => (c.props('question') as any)?.rawContent === 'Q1')
    q!.vm.$emit('question-click', q!.props('question') as any)
    expect(mockBotChat).toHaveBeenCalledWith(expect.objectContaining({ type: 'ASK', questions: 'Q1' }))
  })
  it('F5: FUNCTION search → links 节点', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    seedBuffer()
    emit({ type: 'FUNCTION', data: { FUNCTION: { name: 'search', args: [{ url: 'u', title: 't', content: 'c', icon: 'i' }] } } })
    await nextTick()
    expect(wrapper.find('[data-content-type="links"]').exists()).toBe(true)
  })
  it('F6: FUNCTION searchBookmark → bookmarks 节点，文案非 No Title', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    seedBuffer()
    emit({
      type: 'FUNCTION',
      data: { FUNCTION: { name: 'searchBookmark', args: [{ bookmark_id: 1, highlight_title: '<mark>标题</mark>', highlight_content: '<mark>内容</mark>' }] } }
    })
    await nextTick()
    const node = wrapper.find('[data-content-type="bookmarks"]')
    expect(node.exists()).toBe(true)
    expect(node.text()).not.toContain('No Title')
  })
  it('F7: FUNCTION relatedQuestion → question 数量增加', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    seedBuffer()
    await nextTick()
    const before = wrapper.findAllComponents({ name: 'QuestionMessage' }).length
    emit({ type: 'FUNCTION', data: { FUNCTION: { name: 'relatedQuestion', args: '相关问题' } } })
    await nextTick()
    expect(wrapper.findAllComponents({ name: 'QuestionMessage' }).length).toBeGreaterThan(before)
  })
  it('F8: relatedQuestion 点击 → ASK 发送', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    seedBuffer()
    emit({ type: 'FUNCTION', data: { FUNCTION: { name: 'relatedQuestion', args: '相关问题' } } })
    setChatting(false)
    await nextTick()
    const q = wrapper.findAllComponents({ name: 'QuestionMessage' }).find(c => (c.props('question') as any)?.text === '相关问题')
    q!.vm.$emit('question-click', { content: '相关问题', rawContent: '相关问题' })
    expect(mockBotChat).toHaveBeenCalledWith(expect.objectContaining({ type: 'ASK', questions: '相关问题' }))
  })
  it('F9: processing search → loading tips（空 buffer）', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    emit({ type: 'STATUS_UPDATE', data: { STATUS_UPDATE: { name: 'search', status: 'processing', tips: 'kw' } } })
    await nextTick()
    expect(wrapper.find('[data-tips-type="search"][data-loading="true"]').exists()).toBe(true)
  })
  it('F10: finished search → loading=false 且节点保留', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    emit({ type: 'STATUS_UPDATE', data: { STATUS_UPDATE: { name: 'search', status: 'processing', tips: 'kw' } } })
    await nextTick()
    emit({ type: 'STATUS_UPDATE', data: { STATUS_UPDATE: { name: 'search', status: 'finished', tips: 'kw' } } })
    await nextTick()
    expect(wrapper.find('[data-tips-type="search"]').exists()).toBe(true)
    expect(wrapper.find('[data-tips-type="search"][data-loading="true"]').exists()).toBe(false)
  })
  it('F11: failed search → loading=false', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    emit({ type: 'STATUS_UPDATE', data: { STATUS_UPDATE: { name: 'search', status: 'processing', tips: 'kw' } } })
    await nextTick()
    emit({ type: 'STATUS_UPDATE', data: { STATUS_UPDATE: { name: 'search', status: 'failed', tips: 'kw' } } })
    await nextTick()
    expect(wrapper.find('[data-tips-type="search"][data-loading="true"]').exists()).toBe(false)
  })
  it('F12: processing browser → loading tips', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    emit({ type: 'STATUS_UPDATE', data: { STATUS_UPDATE: { name: 'browser', status: 'processing', tips: 'site' } } })
    await nextTick()
    expect(wrapper.find('[data-tips-type="browser"][data-loading="true"]').exists()).toBe(true)
  })
  it('F13: finished browser → loading=false 且节点保留', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    emit({ type: 'STATUS_UPDATE', data: { STATUS_UPDATE: { name: 'browser', status: 'processing', tips: 'site' } } })
    await nextTick()
    emit({ type: 'STATUS_UPDATE', data: { STATUS_UPDATE: { name: 'browser', status: 'finished', tips: 'site' } } })
    await nextTick()
    expect(wrapper.find('[data-tips-type="browser"]').exists()).toBe(true)
    expect(wrapper.find('[data-tips-type="browser"][data-loading="true"]').exists()).toBe(false)
  })
  it('F14: failed browser → loading=false', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    emit({ type: 'STATUS_UPDATE', data: { STATUS_UPDATE: { name: 'browser', status: 'processing', tips: 'site' } } })
    await nextTick()
    emit({ type: 'STATUS_UPDATE', data: { STATUS_UPDATE: { name: 'browser', status: 'failed', tips: 'site' } } })
    await nextTick()
    expect(wrapper.find('[data-tips-type="browser"][data-loading="true"]').exists()).toBe(false)
  })
  it('F15: processing searchBookmark → loading tips', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    emit({ type: 'STATUS_UPDATE', data: { STATUS_UPDATE: { name: 'searchBookmark', status: 'processing', tips: 'kw' } } })
    await nextTick()
    expect(wrapper.find('[data-tips-type="searchBookmark"][data-loading="true"]').exists()).toBe(true)
  })
  it('F16: finished searchBookmark → loading=false 且节点保留', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    emit({ type: 'STATUS_UPDATE', data: { STATUS_UPDATE: { name: 'searchBookmark', status: 'processing', tips: 'kw' } } })
    await nextTick()
    emit({ type: 'STATUS_UPDATE', data: { STATUS_UPDATE: { name: 'searchBookmark', status: 'finished', tips: 'kw' } } })
    await nextTick()
    expect(wrapper.find('[data-tips-type="searchBookmark"]').exists()).toBe(true)
    expect(wrapper.find('[data-tips-type="searchBookmark"][data-loading="true"]').exists()).toBe(false)
  })
  it('F17: failed searchBookmark → loading=false', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    emit({ type: 'STATUS_UPDATE', data: { STATUS_UPDATE: { name: 'searchBookmark', status: 'processing', tips: 'kw' } } })
    await nextTick()
    emit({ type: 'STATUS_UPDATE', data: { STATUS_UPDATE: { name: 'searchBookmark', status: 'failed', tips: 'kw' } } })
    await nextTick()
    expect(wrapper.find('[data-tips-type="searchBookmark"][data-loading="true"]').exists()).toBe(false)
  })
  it('F18: error → TipsMessage tipsType=error 且 data=err msg', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    emit({ type: 'STATUS_UPDATE', data: { STATUS_UPDATE: { name: 'error', status: 'failed', tips: 'err msg' } } })
    await nextTick()
    const tips = wrapper.findAllComponents({ name: 'TipsMessage' })
    expect(tips.some(c => (c.props('tips') as any).tipsType === 'error' && (c.props('tips') as any).data === 'err msg')).toBe(true)
  })
})
```

> **施工注意（F10/F13/F16）：** `updateTipsXxxStatus(true)` 用正则替换 tips 文案中的 `搜索中...` / `访问中...` 等后缀。由于 mockT 返回的是 i18n key（如 `component.chat_bot.{tips}_searching__{"tips":"kw"}`）而非真实中文，正则可能匹配不到导致替换失败——但**关键断言是 `loading` 被置为 `false`**（`searchMessage.loading = false` 不依赖正则），故 `[data-loading="true"]` 不存在的断言仍成立。若 F10/F13/F16 失败，检查组件 template 是否正确绑定 `:data-loading="content.loading ? 'true' : 'false'"`。

- [ ] **Step 14: 运行 F 组**

Run: `pnpm --filter @apps/slax-reader-dweb test -- SnapshotChatPanel 2>&1 | tail -30` Expected: F1-F18 PASS（失败时回 Task 3 对照修正）

- [ ] **Step 15: 实现 G 组（流式光标与复制按钮，3 条）**

```ts
describe('G. 流式光标与复制按钮', () => {
  it('G1: 流式中显示光标', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    setChatting(true)
    emit({ type: 'CONTENT', data: { CONTENT: 'x' } })
    await nextTick()
    expect(wrapper.find('.chat-msg-ai-caret').exists()).toBe(true)
  })
  it('G2: 流式完成后光标消失', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    setChatting(true)
    emit({ type: 'CONTENT', data: { CONTENT: 'x' } })
    setChatting(false)
    await nextTick()
    expect(wrapper.find('.chat-msg-ai-caret').exists()).toBe(false)
  })
  it('G3: 复制按钮点击 → writeText(内容) + tooltip 出现后消失', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    setChatting(true)
    emit({ type: 'CONTENT', data: { CONTENT: 'hello world' } })
    setChatting(false)
    await nextTick()
    await wrapper.find('.chat-copy-btn').trigger('click')
    expect(navigator.clipboard.writeText as any).toHaveBeenCalledWith('hello world')
    await nextTick()
    expect(wrapper.find('.chat-copied-tip').exists()).toBe(true)
    vi.advanceTimersByTime(1600)
    await nextTick()
    expect(wrapper.find('.chat-copied-tip').exists()).toBe(false)
  })
})
```

> **施工注意（G3）：** `copyMessage` 是 async（`await navigator.clipboard.writeText`）。点击后需 `await nextTick()` 让 `copiedId` 更新生效。`writeText` mock 已 `mockResolvedValue(undefined)`，在 fake timers 下 microtask 仍会 flush——若 tooltip 未出现，在 trigger 后加 `await Promise.resolve()` 再 `await nextTick()`。

- [ ] **Step 16: 运行 G 组**

Run: `pnpm --filter @apps/slax-reader-dweb test -- SnapshotChatPanel 2>&1 | tail -20` Expected: G1-G3 PASS

- [ ] **Step 17: 实现 H 组（暴露接口，2 条）+ I 组（卸载清理，1 条）**

```ts
describe('H. 暴露接口', () => {
  it('H1: addQuoteData 暴露', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    ;(wrapper.vm as any).addQuoteData({ source: {}, data: [{ type: 'text', content: 'q' }] })
    await nextTick()
    expect(wrapper.find('.chat-composer-quote').exists()).toBe(true)
  })
  it('H2: focusTextarea 暴露 → 延迟后 focus 被调用', async () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    const ta = wrapper.find('textarea').element as HTMLTextAreaElement
    const focusSpy = vi.spyOn(ta, 'focus')
    ;(wrapper.vm as any).focusTextarea()
    await nextTick()
    vi.advanceTimersByTime(60)
    expect(focusSpy).toHaveBeenCalled()
  })
})

describe('I. 卸载清理', () => {
  it('I1: unmount → destruct 调用 + chatStatusUpdateHandler 置 undefined', () => {
    const wrapper = mountPanel({ bookmarkId: 1 })
    const inst = mockBotInstance.value
    wrapper.unmount()
    expect(mockBotDestruct).toHaveBeenCalledTimes(1)
    expect(inst.chatStatusUpdateHandler).toBeUndefined()
  })
})
```

> **施工注意（H2）：** `focusTextarea` 内是 `nextTick → blur → setTimeout(focus, 50)`。`isAppeared` watch（immediate）在挂载时也可能触发一次 `focusTextarea`，因此用 `toHaveBeenCalled()` 而非精确次数。

- [ ] **Step 18: 运行全部 42 条**

Run: `pnpm --filter @apps/slax-reader-dweb test -- SnapshotChatPanel 2>&1 | tail -15` Expected: 42 passed（A:4 + B:4 + C:2 + D:6 + E:2 + F:18 + G:3 + H:2 + I:1）

- [ ] **Step 19: Commit**

```bash
git add apps/slax-reader-dweb/tests/unit/components/Chat/SnapshotChatPanel.spec.ts
git commit -m "test(snapshot): add SnapshotChatPanel unit tests (42 cases)"
```

---

## Task 5: 页面集成（bookmarks/[id].vue + s/[id].vue）

> **基线说明（已对账 AI 面板 commit `1ddef31`）**：该 commit 已把两个页面的 `#ai` slot 从 `AISummaries` 换成 `SnapshotAIPanel`，并从 `useBookmark` 解构中移除了 `navigateToText`（AISummaries 的 `@navigated-text` 已删）。**这些改动与 Chat 任务无关，本任务不要回退它们。** Chat 相关的三处改动点（`ChatBot` import、`chatbot` ref、`#chat` slot 内 `<ChatBot>`）**未被 AI 面板 commit 触碰**，依然成立，仅文件行号已变——施工时按符号定位（import 行、`const chatbot`、`#chat` slot），不要按固定行号。

**Files:**

- Modify: `apps/slax-reader-dweb/layers/core/app/pages/bookmarks/[id].vue`
- Modify: `apps/slax-reader-dweb/layers/core/app/pages/s/[id].vue`

- [ ] **Step 1: bookmarks/[id].vue 替换 import 与 ref 类型**

`bookmarks/[id].vue` 中（注意此时 import 区已有 `SnapshotAIPanel` 等多个 Snapshot 组件，按符号查找定位）：

- import 行 `import ChatBot from '#layers/core/app/components/Chat/ChatBot.vue'` 改为 `import SnapshotChatPanel from '#layers/core/app/components/Snapshot/SnapshotChatPanel.vue'`
- `const chatbot = ref<InstanceType<typeof ChatBot>>()` 改为 `const chatbot = ref<InstanceType<typeof SnapshotChatPanel>>()`
- `#chat` slot 内 `<ChatBot ... />` 改为 `<SnapshotChatPanel ... />`（props/事件保持不变；`#ai` slot 的 `SnapshotAIPanel` 不动）

- [ ] **Step 2: s/[id].vue 同样替换**

`s/[id].vue` 中执行相同三处替换（import、ref 类型、模板标签）。`s/[id].vue` 的 ChatBot 用 `:share-code="shareCode"`，保持不变。

- [ ] **Step 3: 确认无残留 ChatBot 引用**

Run: `grep -rn "from '#layers/core/app/components/Chat/ChatBot.vue'\|<ChatBot" apps/slax-reader-dweb/layers/core/app/pages/bookmarks/[id].vue apps/slax-reader-dweb/layers/core/app/pages/s/[id].vue` Expected: 无输出（两个页面已无旧 ChatBot 引用）

- [ ] **Step 4: 类型检查通过**

Run: `pnpm --filter @apps/slax-reader-dweb exec nuxt prepare && pnpm --filter @apps/slax-reader-dweb exec vue-tsc --noEmit -p . 2>&1 | grep -iE "bookmarks/\[id\]|s/\[id\]|SnapshotChatPanel" || echo "NO TYPE ERROR IN PAGES"` Expected: 输出 `NO TYPE ERROR IN PAGES`

- [ ] **Step 5: Commit**

```bash
git add apps/slax-reader-dweb/layers/core/app/pages/bookmarks/[id].vue apps/slax-reader-dweb/layers/core/app/pages/s/[id].vue
git commit -m "feat(snapshot): wire SnapshotChatPanel into bookmarks/s detail pages"
```

---

## Task 6: 集成测试同步更新

> **基线说明（已对账 AI 面板 commit `1ddef31`）**：`baseStubs` 里 `AISummaries` 已被替换为 `SnapshotAIPanel`（`{ name: 'SnapshotAIPanel', props: ['bookmarkId','shareCode','isAppeared'], emits: ['dismiss'] }`）。**这个 stub 不要动。** 紧跟其后的 `ChatBot` stub **仍存在**，本任务只改它。

**Files:**

- Modify: `apps/slax-reader-dweb/tests/integration/pages/bookmarks/[id].spec.ts`

- [ ] **Step 1: 替换 stub 定义**

`bookmarks/[id].spec.ts` 的 `baseStubs` 里（`SnapshotAIPanel` stub 之后那一项），将 `ChatBot` stub：

```ts
  ChatBot: {
    name: 'ChatBot',
    template: '<div class="chat-bot" />',
    ...
  },
```

改为：

```ts
  SnapshotChatPanel: {
    name: 'SnapshotChatPanel',
    template: '<div class="chat-bot" />',
    ...
  },
```

（stub 实现体保持原样，仅改 key 与 `name` 字段；`template` / `props` / `emits` 等不变）

- [ ] **Step 2: 替换 C32 用例的 findComponent**

约 646 行：

```ts
const chatbot = wrapper.findComponent({ name: 'ChatBot' })
```

改为：

```ts
const chatbot = wrapper.findComponent({ name: 'SnapshotChatPanel' })
```

同步更新该用例描述（620 行 `C32: ChatBot find-quote ...` → `C32: SnapshotChatPanel find-quote ...`）。

- [ ] **Step 3: 确认无残留 ChatBot 字符串**

Run: `grep -n "ChatBot" apps/slax-reader-dweb/tests/integration/pages/bookmarks/[id].spec.ts || echo "NO ChatBot REFERENCE LEFT"` Expected: 输出 `NO ChatBot REFERENCE LEFT`（或仅剩与本次无关的注释）

- [ ] **Step 4: 运行该集成测试**

Run: `pnpm --filter @apps/slax-reader-dweb test -- "bookmarks/[id]" 2>&1 | tail -20` Expected: 该 spec 全部通过（含 C32）

- [ ] **Step 5: Commit**

```bash
git add apps/slax-reader-dweb/tests/integration/pages/bookmarks/[id].spec.ts
git commit -m "test(snapshot): update bookmarks integration stub to SnapshotChatPanel"
```

---

## Task 7: 全量验证

**Files:** 无（仅运行验证命令）

- [ ] **Step 1: 全量单测通过**

Run: `pnpm --filter @apps/slax-reader-dweb test 2>&1 | tail -15` Expected: 全部测试通过，无新增失败（含新增 SnapshotChatPanel.spec.ts 42 条 + 原 ChatBot.spec.ts 仍通过 + 集成测试通过）

- [ ] **Step 2: 类型检查全量通过**

Run: `pnpm --filter @apps/slax-reader-dweb exec nuxt prepare && pnpm --filter @apps/slax-reader-dweb exec vue-tsc --noEmit -p . 2>&1 | grep -i "error TS" || echo "NO TYPE ERRORS"` Expected: 输出 `NO TYPE ERRORS`

- [ ] **Step 3: format + lint 通过**

Run: `pnpm format:check && pnpm lint 2>&1 | grep -iE "✖|error" | grep -v warning || echo "NO LINT ERRORS"` Expected: format 通过；lint 无 error（warning 不阻塞）

- [ ] **Step 4: 更新 graphify 知识图谱**

Run: `cd apps/slax-reader-dweb && graphify update . 2>&1 | tail -3 || echo "graphify skip"` Expected: 图谱更新成功或可跳过

- [ ] **Step 5: 手验清单（dev server）**

Run: `pnpm --filter @apps/slax-reader-dweb dev` 然后人工验证（访问 `http://localhost:3000/bookmarks/<id>`，打开 Chat tab）：

- [ ] 空态：星形图标 + 文案 + 3 条建议问题胶囊正确渲染
- [ ] 点击建议问题 → 用户气泡出现 + AI 开始流式回复（末尾闪烁光标）
- [ ] AI 回复完成 → 光标消失、复制按钮出现，点击复制显示「已复制」tooltip
- [ ] 正文划选 → 选区菜单点 Chat → Chat 面板打开且引用条显示
- [ ] 引用条 ✕ 可取消；带引用发送后引用块紧贴用户气泡上方（`margin-bottom: -12px`）
- [ ] Enter 发送 / Shift+Enter 换行；中文输入法组合中 Enter 不误发
- [ ] 输入框样式与评论面板一致（上边线、focus 光晕、发送按钮禁用态）
- [ ] light / dark / eink 三主题视觉正确
- [ ] 访问 `http://localhost:3000/s/<shareCode>` 验证分享页 Chat 同样正常

- [ ] **Step 6: 生成验证报告并 Commit（可选）**

将手验结果记录到 `.claude/verification-report-snapshot-chat-panel.md`，然后：

```bash
git add .claude/verification-report-snapshot-chat-panel.md 2>/dev/null || true
git commit -m "docs(snapshot): add SnapshotChatPanel verification report" 2>/dev/null || true
```

---

## 自检对账

**Spec 覆盖：**

- §4.1 空态 → Task 3 template `.chat-empty` + Task 4 A 组 ✅
- §4.2 消息流（用户气泡/引用块/AI 消息/光标/复制按钮）→ Task 3 template + style + Task 4 C/D/F/G 组 ✅
- §4.3 输入框 → Task 3 `.chat-composer` + Task 4 D/E 组 ✅
- §五 逻辑迁移清单 14 函数 → Task 3 script 全量迁移 ✅
- §六 Props/Emits/Expose → Task 3 defineProps/defineEmits/defineExpose ✅
- §六 useBookmark ChatBotLike → Task 2 ✅
- §七 集成变更（bookmarks/s/集成测试）→ Task 5 + Task 6 ✅
- §八 i18n → Task 1 ✅
- §九 42 条测试 → Task 4（A:4 B:4 C:2 D:6 E:2 F:18 G:3 H:2 I:1 = 42）✅

**Placeholder 扫描：** 组件代码与测试均为完整实现，无 TODO/TBD ✅

**类型一致性：** `addQuoteData(data: QuoteData)` / `focusTextarea()` / `sendMessage(text?: string)` / `chatStatusUpdateHandler` 在组件、useBookmark 接口、测试中命名一致 ✅
