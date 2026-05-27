<template>
  <div v-if="allowAction !== false" class="comment-composer">
    <!-- 引用条（replying 状态） -->
    <div v-if="pendingQuote" class="composer-quote">
      <span class="quote-preview">{{ quotePreview }}</span>
      <button class="quote-cancel" :title="$t('page.bookmarks_detail.cancel_quote')" @click="cancelReply">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <div class="composer-input-row">
      <textarea
        ref="textareaRef"
        v-model="inputText"
        class="composer-textarea"
        :placeholder="$t('page.bookmarks_detail.comment_placeholder')"
        :disabled="sending"
        rows="1"
        @keydown.enter.exact.prevent="handleSend"
        @keydown.enter.shift.exact="() => {}"
        @input="autoResize"
      />
      <button class="composer-send" :disabled="!inputText.trim() || sending" @click="handleSend">
        <div v-if="sending" class="i-svg-spinners:90-ring w-14px" />
        <span v-else>{{ $t('common.operate.submit') }}</span>
      </button>
    </div>
    <p class="composer-hint">{{ $t('page.bookmarks_detail.send_hint') }}</p>
  </div>
</template>

<script lang="ts" setup>
import type { MarkCommentInfo, MarkItemInfo, QuoteData } from '@slax-reader/selection/types'
import type { DwebArticleSelection } from '#layers/core/app/components/Article/Selection/DwebArticleSelection'
import { getUUID } from '#layers/core/app/components/Article/Selection/tools'
import { showLoginModal } from '#layers/core/app/components/Modal'
import Toast, { ToastType } from '#layers/core/app/components/Toast'
import { useUserStore } from '#layers/core/app/stores/user'

const props = defineProps<{
  allowAction?: boolean
  articleSelection: DwebArticleSelection | null
  pendingSelection: MarkItemInfo | null
  pendingQuote: QuoteData | null
  activeInfoId: string | null
}>()

const emits = defineEmits<{
  sent: [infoId: string]
  'cancel-reply': []
}>()

const { t } = useI18n()
const userStore = useUserStore()
const textareaRef = ref<HTMLTextAreaElement>()
const inputText = ref('')
const sending = ref(false)

const quotePreview = computed(() => {
  if (!props.pendingQuote) return ''
  const texts = props.pendingQuote.data.filter(d => d.type === 'text').map(d => d.content)
  const full = texts.join('')
  return full.length > 60 ? full.slice(0, 60) + '…' : full
})

const cancelReply = () => {
  emits('cancel-reply')
}

const autoResize = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 120) + 'px'
}

const handleSend = async () => {
  if (!inputText.value.trim() || sending.value) return

  // 未登录时弹登录 modal
  if (!userStore.userInfo) {
    showLoginModal({ redirect: location.href })
    return
  }

  if (!props.articleSelection) return

  sending.value = true
  const comment = inputText.value.trim()

  try {
    let info: MarkItemInfo

    if (props.pendingSelection) {
      // 优先级 1：有新选区
      info = props.pendingSelection
    } else if (props.activeInfoId) {
      // 优先级 2：点击已有划线
      const existing = props.articleSelection.markItemInfos?.value?.find(i => i.id === props.activeInfoId)
      if (existing) {
        info = existing
      } else {
        // 退化为全文评论
        info = { id: getUUID(), source: [], comments: [], stroke: [], approx: undefined }
      }
    } else {
      // 优先级 3：全文评论
      info = { id: getUUID(), source: [], comments: [], stroke: [], approx: undefined }
    }

    const resultInfoId = await props.articleSelection.strokeSelection({ info, comment })

    if (!resultInfoId) {
      Toast.showToast({ text: t('common.tips.operate_failed'), type: ToastType.Error })
      return
    }

    inputText.value = ''
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto'
    }
    emits('sent', resultInfoId)
    emits('cancel-reply')
  } catch {
    Toast.showToast({ text: t('common.tips.operate_failed'), type: ToastType.Error })
  } finally {
    sending.value = false
  }
}
</script>

<style lang="scss" scoped>
.comment-composer {
  --style: flex-none border-t-(1px solid border) px-16px py-12px flex flex-col gap-8px;
  position: sticky;
  bottom: 0;
  background: var(--slax-surface-solid);
}

.composer-quote {
  --style: flex items-center justify-between gap-8px px-10px py-6px rounded-sm;
  background: var(--slax-accent-bg);
  border-left: 2px solid var(--slax-accent-soft);

  .quote-preview {
    font-size: var(--slax-fs-tag);
    color: var(--slax-text-muted);
    font-style: italic;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    flex: 1;
  }

  .quote-cancel {
    --style: 'flex-none w-16px h-16px flex items-center justify-center cursor-pointer';
    color: var(--slax-text-light);
    background: transparent;

    &:hover {
      color: var(--slax-danger);
    }
  }
}

.composer-input-row {
  --style: flex items-end gap-8px;
}

.composer-textarea {
  --style: flex-1 resize-none rounded-sm px-10px py-8px text-aux outline-none transition-colors duration-fast;
  min-height: 36px;
  max-height: 120px;
  background: var(--slax-surface);
  border: 1px solid var(--slax-border);
  color: var(--slax-text);

  &:focus {
    border-color: var(--slax-accent-soft);
  }

  &::placeholder {
    color: var(--slax-text-light);
  }
}

.composer-send {
  --style: 'flex-none px-12px py-8px rounded-sm text-aux font-500 cursor-pointer transition-colors duration-fast';
  background: var(--slax-accent);
  color: white;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    opacity: 0.9;
  }
}

.composer-hint {
  font-size: var(--slax-fs-tag);
  color: var(--slax-text-light);
}
</style>
