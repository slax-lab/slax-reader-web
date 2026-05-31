<template>
  <div class="tags-header">
    <template v-if="!selectTagId">
      <div class="tags-grids">
        <div class="add tag-item">
          <div class="tag-add" v-if="!isAddingTag" @click="addTagClick">
            <i class="h-10px w-10px bg-[length:10px_10px] bg-[url('@images/tiny-plus-icon.png')] bg-contain"></i>
            <span>{{ t('component.tags_header.add_tag') }}</span>
          </div>
          <div class="tag-input" v-else>
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
            <i class="seperator"></i>
            <button v-if="!isAddingTagLoading">{{ t('common.operate.add') }}</button>
            <div class="i-svg-spinners:90-ring w-48px color-#f4c982" v-else></div>
          </div>
        </div>
      </div>
      <div class="tags-grids">
        <TransitionGroup name="opacity">
          <div class="tag-item group" v-for="tag in tags" :key="tag.id">
            <div class="tag-cell" @click="selectTag(tag)">
              <span class="tag-name">{{ tag.show_name }}</span>
              <i class="ai" v-if="tag.system"></i>
            </div>
            <div class="tag-operate min-w-30px group-hover:!opacity-100">
              <button @click="editTagClick(tag)" v-if="!tag.system">
                <img src="@images/button-edit-outline-icon.png" />
              </button>
            </div>
          </div>
        </TransitionGroup>
      </div>
      <div class="tags-grids" v-if="isTagLoading">
        <div class="loading">
          <div class="i-svg-spinners:90-ring w-24px color-#f4c982"></div>
          <span>{{ $t('component.tags_header.loading') }}</span>
        </div>
      </div>
    </template>
    <div class="selected-tag" v-else>
      <div class="tag-header">
        <button class="bg-[length:16px_16px] bg-[url('@images/button-navigate-back.png')] bg-center" @click="unselectTag"></button>
        <span>{{ $t('component.tags_header.filter_tag_title', { title: filterTagName || '' }) }} </span>
      </div>
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
  padding-bottom: 8px;

  .tags-grids {
    display: grid;
    gap: 8px;
    padding: 0 4px;
    grid-template-columns: repeat(2, 1fr);

    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }

    &:first-child {
      padding-top: 4px;
      margin-bottom: 4px;
    }

    &:not(:first-child) {
      padding-top: 4px;
    }

    .tag-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      user-select: none;

      &.add {
        grid-column: 1 / -1;
      }

      .tag-add {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: var(--slax-radius-sm);
        background: var(--slax-accent-bg);
        border: 1px dashed color-mix(in srgb, var(--slax-accent) 30%, transparent);
        cursor: pointer;
        transition: all 0.15s;
        flex: 1;

        &:hover {
          background: color-mix(in srgb, var(--slax-accent) 10%, transparent);
          border-color: var(--slax-accent);
        }

        i {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
          color: var(--slax-accent);
          opacity: 0.8;
          background-image: none;
          display: flex;
          align-items: center;
          justify-content: center;

          &::before {
            content: '+';
            font-size: 16px;
            line-height: 1;
            color: var(--slax-accent);
          }
        }

        span {
          font-size: 13px;
          color: var(--slax-accent);
          line-height: 1.4;
        }
      }

      .tag-input {
        display: flex;
        align-items: center;
        flex: 1;
        border: 1px solid var(--slax-accent);
        border-radius: var(--slax-radius-sm);
        background: var(--slax-accent-bg);
        box-shadow: 0 0 0 3px var(--slax-accent-bg);
        overflow: hidden;

        input {
          flex: 1;
          min-width: 0;
          padding: 10px 14px;
          font-size: 13px;
          color: var(--slax-text);
          background: transparent;
          border: none;
          outline: none;
          font-family: inherit;

          &::placeholder {
            color: var(--slax-text-light);
          }
        }

        .seperator {
          width: 1px;
          height: 14px;
          background: var(--slax-border);
          flex-shrink: 0;
        }

        button {
          flex-shrink: 0;
          padding: 0 14px;
          height: 100%;
          font-size: 13px;
          color: var(--slax-accent);
          font-weight: 500;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: opacity 0.12s;

          &:hover {
            opacity: 0.8;
          }
        }
      }

      .tag-cell {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex: 1;
        padding: 10px 14px;
        border: 1px solid var(--slax-border);
        border-radius: var(--slax-radius-sm);
        background: var(--slax-surface);
        cursor: pointer;
        transition: all 0.15s;
        overflow: hidden;
        box-shadow: inset 0 1px 0 var(--slax-inset-hi);

        &:hover {
          border-color: color-mix(in srgb, var(--slax-accent) 40%, transparent);
          background: var(--slax-accent-bg);
        }

        span {
          font-size: 13px;
          color: var(--slax-text-muted);
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        &:has(.ai) {
          opacity: 0.7;
        }

        .ai {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
          background-image: url('@images/cell-ai-style-icon.png');
          background-size: contain;
          background-repeat: no-repeat;
          opacity: 0.6;
        }
      }

      .tag-operate {
        flex-shrink: 0;
        opacity: 0;
        transition: opacity 0.15s;

        button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: 1px solid var(--slax-border);
          border-radius: 50%;
          background: var(--slax-surface-solid);
          cursor: pointer;
          transition: all 0.12s;

          &:hover {
            border-color: var(--slax-accent);
            background: var(--slax-accent-bg);
          }

          img {
            width: 14px;
            height: 14px;
            object-fit: contain;
          }
        }
      }

      &:hover .tag-operate {
        opacity: 1;
      }
    }

    .loading {
      display: flex;
      align-items: center;
      gap: 10px;
      grid-column: 1 / -1;
      padding: 8px 4px;

      span {
        font-size: 13px;
        color: var(--slax-text-light);
      }
    }
  }

  .selected-tag {
    padding: 0 4px;

    .tag-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 0 20px;
      border-bottom: 1px solid var(--slax-border);
      margin-bottom: 16px;

      button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border: 1px solid var(--slax-border);
        border-radius: var(--slax-radius-sm);
        background: transparent;
        cursor: pointer;
        color: var(--slax-text-muted);
        transition: all 0.15s;
        background-image: none;

        &::before {
          content: '';
          display: block;
          width: 16px;
          height: 16px;
          background-image: url('@images/button-navigate-back.png');
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
        }

        &:hover {
          background: var(--slax-surface);
          border-color: color-mix(in srgb, var(--slax-accent) 30%, var(--slax-border));
        }
      }

      span {
        font-size: 15px;
        color: var(--slax-text);
        font-weight: 500;
        line-height: 1.4;
      }
    }
  }
}
</style>
