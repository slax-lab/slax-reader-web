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
import { showEditTagModal } from '#layers/core/components/Modal'
import Toast, { ToastType } from '#layers/core/components/Toast'

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
  const res = await request.get<BookmarkTag[]>({
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
  const res = await request.post<BookmarkTag>({
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
  .tags-grids {
    --style: 'px-54px grid gap-y-16px max-lg:(grid-cols-1) grid-cols-2 gap-x-63px not-first:pt-16px';

    &:has(.add) {
      --style: pt-24px;
    }

    .tag-item {
      --style: flex items-center justify-between p-0 select-none;

      &.add {
        --style: pr-46px;
      }

      .tag-add {
        --style: 'py-10px px-16px rounded-6px bg-#a28d6414 flex-1 flex items-center cursor-pointer transition-colors duration-250 hover:bg-#a28d6430';
        span {
          --style: ml-12px text-(15px #a28d64) line-height-16px;
        }
      }

      .tag-input {
        --style: border-(1px solid #f4c982) rounded-6px p-0 flex-1 flex items-center justify-between cursor-pointer transition-all duration-250;

        input {
          --style: flex-1 min-w-0 px-16px py-10px text-(15px #a28d64) line-height-16px font-500 bg-transparent;

          &::placeholder,
          &::-webkit-input-placeholder {
            --style: text-(15px #a28d64) font-400;
          }
        }

        .seperator {
          --style: w-1px h-14px bg-#0f141914 shrink-0;
        }

        button {
          --style: 'shrink-0 px-12px text-(15px #a28d64) font-500 line-height-16px h-full transition-transfrom duration-250 hover:scale-105 active:scale-110';
        }
      }

      .tag-cell {
        --style: border-(1px solid #e4d6ba) rounded-6px px-16px py-10px flex-1 flex items-center justify-between cursor-pointer transition-all duration-250 overflow-hidden;

        span {
          --style: text-(15px #a28d64) line-height-16px text-ellipsis overflow-hidden whitespace-nowrap;
        }

        &:has(.ai) {
          --style: border-#e4d6ba4d;
          span {
            --style: text-#333333ad;
          }
        }

        &:hover {
          --style: '!border-(#f4c982)';
        }

        .ai {
          --style: bg-contain w-16px h-16px shrink-0;
          background-image: url('@images/cell-ai-style-icon.png');
        }
      }

      .tag-operate {
        --style: ml-16px shrink-0 rounded-full flex-center select-none transition-opacity duration-250 opacity-0;
        button {
          --style: 'rounded-full w-30px h-30px border-(1px solid #e4d6ba) flex-center transition-transform duration-250 not-first:ml-5px';

          &:hover {
            --style: scale-110;
          }

          &:active {
            --style: scale-115;
          }
          img {
            --style: w-16px h-16px object-fit;
          }
        }
      }
    }

    .loading {
      --style: 'flex items-center max-md:(justify-center)';

      span {
        --style: ml-10px text-(15px #a28d64);
      }
    }
  }

  .selected-tag {
    --style: px-24px;
    .tag-header {
      --style: flex items-center py-24px border-b-(1px solid #ecf0f5);

      button {
        --style: w-16px h-16px;
      }

      span {
        --style: ml-14px text-(#333 16px) line-height-20px font-500;
      }
    }
  }
}
</style>
