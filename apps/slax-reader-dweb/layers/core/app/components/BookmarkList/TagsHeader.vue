<template>
  <div class="tags-header">
    <template v-if="!selectTagId">
      <!-- 添加标签行 -->
      <div class="tags-add-row">
        <div class="tag-add" v-if="!isAddingTag" @click="addTagClick">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          <span>{{ t('component.tags_header.add_tag') }}</span>
        </div>
        <div class="tag-input-wrap" v-else>
          <input
            ref="tagInput"
            type="text"
            :disabled="isAddingTagLoading"
            v-model="addingTagName"
            :placeholder="t('component.tags_header.add_tag_placeholder')"
            @compositionstart="compositionstart"
            @compositionend="compositionend"
            v-on-key-stroke:Escape,Enter="[onKeyDown, { eventName: 'keydown' }]"
          />
          <button v-if="!isAddingTagLoading" @click="saveTag" class="tag-input-confirm">
            {{ t('common.operate.add') }}
          </button>
          <div class="i-svg-spinners:90-ring w-16px" style="color: var(--slax-accent)" v-else></div>
        </div>
      </div>

      <!-- 加载中 -->
      <div class="tags-loading" v-if="isTagLoading">
        <div class="i-svg-spinners:90-ring w-16px" style="color: var(--slax-accent)"></div>
        <span>{{ $t('component.tags_header.loading') }}</span>
      </div>

      <!-- 标签列表 -->
      <div class="tags-list">
        <TransitionGroup name="opacity">
          <div class="tag-item" v-for="tag in tags" :key="tag.id">
            <button class="tag-chip" :class="{ system: tag.system }" @click="selectTag(tag)">
              <span>{{ tag.show_name }}</span>
              <i class="ai-badge" v-if="tag.system"></i>
            </button>
            <button class="tag-edit-btn" v-if="!tag.system" @click="editTagClick(tag)" :title="t('common.operate.edit')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        </TransitionGroup>
      </div>
    </template>

    <!-- 已选标签：显示返回 + 标签名 -->
    <div class="selected-tag-header" v-else>
      <button class="back-btn" @click="unselectTag">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        <span>{{ $t('component.tags_header.filter_tag_title', { title: filterTagName || '' }) }}</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { RESTMethodPath } from '@commons/types/const'
import type { BookmarkTag } from '@commons/types/interface'
import { vOnKeyStroke } from '@vueuse/components'
import { showEditTagModal } from '#layers/core/app/components/Modal'
import Toast, { ToastType } from '#layers/core/app/components/Toast'

const { t } = useI18n()

const props = defineProps({
  selectTagId: {
    type: Number,
    required: false
  },
  selectTagName: {
    type: String,
    required: false
  }
})

const emits = defineEmits(['select-tag'])

const isTagLoading = ref(false)
const isAddingTagLoading = ref(false)
const isAddingTag = ref(false)
const compositionAppear = ref(false)
const tagInput = ref<HTMLInputElement>()
const addingTagName = ref('')
const tags = ref<BookmarkTag[]>([])
const filterTagName = ref(props.selectTagName || '')

watch(
  () => props.selectTagId,
  (value, oldValue) => {
    if (value !== oldValue) {
      updateSelectTag(value || 0)
    }
  }
)

const loadUserTags = async () => {
  if (isTagLoading.value) {
    return
  }

  isTagLoading.value = true
  const res = await request().get<BookmarkTag[]>({
    url: RESTMethodPath.TAG_LIST
  })

  if (!res) {
    Toast.showToast({
      text: t('common.error.network'),
      type: ToastType.Error
    })
  } else {
    tags.value = res.filter(tag => !!tag.display)

    if (props.selectTagId) {
      updateSelectTag(props.selectTagId)
    }
  }

  isTagLoading.value = false
}

loadUserTags()

onMounted(() => {
  if (props.selectTagId) {
    emits('select-tag', {
      id: props.selectTagId,
      name: filterTagName.value || ''
    })
  }
})

const updateSelectTag = (id: number) => {
  if (id) {
    filterTagName.value = tags.value.find(tag => tag.id === id)?.show_name || ''
  } else {
    filterTagName.value = ''
  }
}

const addTagClick = () => {
  isAddingTag.value = true
  nextTick(() => {
    tagInput.value?.focus()
  })
}

const editTagClick = (tag: BookmarkTag) => {
  showEditTagModal({
    tagId: tag.id,
    tagName: tag.show_name,
    callback: (id: number, name: string) => {
      if (id !== tag.id) {
        return
      }

      tag.show_name = name
    },
    deleteCallback: (id: number) => {
      if (id !== tag.id) {
        return
      }

      tags.value = tags.value.filter(tag => tag.id !== id)
    }
  })
}

const saveTag = async () => {
  if (isAddingTagLoading.value) {
    return
  }

  const tagName = addingTagName.value.trim()
  if (!tagName.length) {
    isAddingTag.value = false
    return
  }

  isAddingTagLoading.value = true
  const res = await request().post<BookmarkTag>({
    url: RESTMethodPath.ADD_USER_TAG,
    body: { tag_name: tagName }
  })

  if (!res) {
    Toast.showToast({
      text: t('common.error.network'),
      type: ToastType.Error
    })
    return
  }

  isAddingTag.value = false
  isAddingTagLoading.value = false
  addingTagName.value = ''

  if (!tags.value.find(tag => tag.id === res.id)) {
    tags.value.push(res)
  }
}

const onKeyDown = async (e: KeyboardEvent) => {
  if (compositionAppear.value) {
    return
  }

  if (e.key !== 'Enter') {
    if (e.key === 'Escape') {
      isAddingTag.value = false
    }
    return
  }

  await saveTag()
}

const selectTag = (tag: BookmarkTag) => {
  emits('select-tag', {
    id: tag.id,
    name: tag.show_name
  })
}

const unselectTag = () => {
  emits('select-tag', null)
}

const compositionstart = () => {
  compositionAppear.value = true
}

const compositionend = () => {
  compositionAppear.value = false
}
</script>

<style lang="scss" scoped>
.tags-header {
  padding-bottom: 16px;
}

// 添加标签行
.tags-add-row {
  margin-bottom: 16px;
  user-select: none;
}

.tag-add {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border: 1px dashed color-mix(in srgb, var(--slax-accent) 35%, transparent);
  border-radius: 999px;
  background: var(--slax-accent-bg);
  color: var(--slax-accent);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: var(--slax-accent);
    background: color-mix(in srgb, var(--slax-accent) 10%, transparent);
  }

  svg {
    flex-shrink: 0;
    opacity: 0.8;
  }
}

.tag-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid var(--slax-accent);
  border-radius: 999px;
  background: var(--slax-accent-bg);
  box-shadow: 0 0 0 3px var(--slax-accent-bg);
  max-width: 320px;

  input {
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    outline: none;
    font-size: 13px;
    color: var(--slax-text);
    font-family: inherit;

    &::placeholder {
      color: var(--slax-text-light);
    }
  }
}

.tag-input-confirm {
  flex-shrink: 0;
  padding: 3px 10px;
  background: var(--slax-accent);
  color: var(--slax-btn-text);
  border: none;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.12s;

  &:hover {
    opacity: 0.85;
  }
}

// 加载中
.tags-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  font-size: 13px;
  color: var(--slax-text-light);
}

// 标签列表：flex wrap 胶囊布局
.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid var(--slax-border);
  border-radius: 999px;
  background: var(--slax-surface);
  color: var(--slax-text-muted);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
  box-shadow: inset 0 1px 0 var(--slax-inset-hi);

  &:hover {
    border-color: color-mix(in srgb, var(--slax-accent) 40%, transparent);
    background: var(--slax-accent-bg);
    color: var(--slax-text);
  }

  &.system {
    opacity: 0.65;
  }
}

.ai-badge {
  display: inline-block;
  width: 14px;
  height: 14px;
  background-image: url('@images/cell-ai-style-icon.png');
  background-size: contain;
  background-repeat: no-repeat;
  opacity: 0.6;
  flex-shrink: 0;
}

.tag-edit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid var(--slax-border);
  border-radius: 50%;
  background: var(--slax-surface-solid);
  color: var(--slax-text-light);
  cursor: pointer;
  opacity: 0;
  transition: all 0.12s;

  .tag-item:hover & {
    opacity: 1;
  }

  &:hover {
    border-color: var(--slax-accent);
    color: var(--slax-accent);
    background: var(--slax-accent-bg);
  }
}

// 已选标签 header
.selected-tag-header {
  padding-bottom: 20px;
  border-bottom: 1px solid var(--slax-border);
  margin-bottom: 16px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--slax-border);
  border-radius: var(--slax-radius-sm);
  background: transparent;
  color: var(--slax-text-muted);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: var(--slax-surface);
    color: var(--slax-text);
    border-color: color-mix(in srgb, var(--slax-accent) 30%, var(--slax-border));
  }

  span {
    font-weight: 500;
    color: var(--slax-text);
  }
}
</style>
