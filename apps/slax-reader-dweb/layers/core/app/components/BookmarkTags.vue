<template>
  <div class="bookmark-tags" ref="bookmarkTagsEle">
    <div class="tags-list">
      <TransitionGroup name="cell">
        <div class="tag" v-for="tag in bookmarkTags" :key="tag.show_name">
          <span class="tag-name">{{ tag.show_name }}</span>
          <button v-if="!props.readonly" class="tag-remove" :title="$t('common.operate.delete')" @click="deleteBookmarkTag(tag.id)">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <line x1="1" y1="1" x2="9" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              <line x1="9" y1="1" x2="1" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </TransitionGroup>

      <div class="loading" v-if="isTagLoading">
        <div class="i-svg-spinners:90-ring w-16px" style="color: var(--slax-accent)" />
      </div>

      <div class="tag-add-wrap" v-if="!props.readonly">
        <button ref="add" class="tag-add" :title="$t('common.operate.add')" @click="addingTagClick">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <line x1="5" y1="1" x2="5" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
        <Transition name="opacity">
          <div class="search-list" ref="searchList" v-show="isAddingTag" v-on-click-outside="() => (isAddingTag = false)">
            <input v-autofocus="{ enabled: isAddingTag }" type="text" :placeholder="$t('component.bookmark_tags.placeholder')" v-model="searchText" v-on-key-stroke:Enter="[onKeyDown, { eventName: 'keydown' }]" />
            <div class="search-result">
              <div class="result-wrapper">
                <div class="search-tag" v-for="tag in searchResultTags" :key="tag.id" @click="searchTagClick(tag.id)">
                  <span>{{ tag.show_name }}</span>
                  <i class="ai" v-if="tag.system" />
                </div>
              </div>
            </div>
            <div class="list-loading" v-if="isAddingLoading">
              <div class="i-svg-spinners:90-ring w-24px" style="color: var(--slax-accent)" />
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { RESTMethodPath } from '@commons/types/const'
import type { BookmarkTag } from '@commons/types/interface'
import { vOnClickOutside, vOnKeyStroke } from '@vueuse/components'
import { LocalFirstAdapterKey } from '#layers/core/app/composables/local-first/injection'

const props = defineProps({
  bookmarkId: {
    type: Number,
    required: false
  },
  // /b owner 走 REST 增删标签用
  bookmarkUid: {
    type: String,
    required: false,
    default: ''
  },
  // LF 本地标签 key（由 BookmarkArticle 注入）。
  // 仅认 bookmarkUuid，不回退 bookmarkUid。
  bookmarkUuid: {
    type: String,
    required: false,
    default: ''
  },
  tags: {
    type: Array as PropType<BookmarkTag[]>,
    required: true
  },
  readonly: {
    type: Boolean,
    required: false
  }
})

// 本地标签源 + catalog；null（非 LF）则走 REST。
const lf = inject(LocalFirstAdapterKey, null)
const tagSrc = lf?.bookmarkTagSource?.(computed(() => props.bookmarkUuid)) ?? null
const localActive = !!tagSrc

const bookmarkTagsEle = ref<HTMLDivElement>()
const add = ref<HTMLButtonElement>()
const searchList = ref<HTMLDivElement>()

// 双轨：LF 走只读 computed，REST 走 rest* ref
const restBookmarkTags = ref<BookmarkTag[]>(props.tags || [])
const restSearchTags = ref<BookmarkTag[]>([])
const bookmarkTags = computed<BookmarkTag[]>(() => (localActive ? tagSrc!.tags.value : restBookmarkTags.value))
const searchTags = computed<BookmarkTag[]>(() => (localActive ? tagSrc!.userTags.value : restSearchTags.value))

const isTagLoading = ref(false)
const isAddingLoading = ref(false)
const isAddingTag = ref(false)
const searchText = ref('')
const currentBookmarkTagIds = computed(() => bookmarkTags.value.map(tag => tag.id) || [])

const filteredSearchTags = computed(() => {
  return searchTags.value.filter(tag => currentBookmarkTagIds.value.indexOf(tag.id) === -1)
})

const searchResultTags = computed(() => {
  if (!searchText.value) {
    return filteredSearchTags.value
  }
  return filteredSearchTags.value.filter(tag => tag.show_name.includes(searchText.value))
})

watch(
  () => props.tags,
  newTags => {
    if (localActive) return // LF：不接 props.tags
    restBookmarkTags.value = newTags
  },
  { deep: true }
)

watch(
  () => isAddingTag.value,
  value => {
    if (value) {
      const eleRect = bookmarkTagsEle.value?.getBoundingClientRect()
      const rect = add.value?.getBoundingClientRect()
      if (eleRect && rect && searchList.value) {
        const yOffset = rect.bottom - eleRect.top + 10
        const xOffset = rect.left - eleRect.left
        searchList.value.style.top = `${yOffset}px`
        searchList.value.style.left = `${xOffset}px`
      }
      searchingTags()
    } else {
      searchText.value = ''
    }
  }
)

onMounted(() => {})

const searchingTags = async () => {
  if (localActive) return // LF：searchTags 走 userTags
  if (isAddingLoading.value) return
  isAddingLoading.value = true
  const res = await request().get<BookmarkTag[]>({ url: RESTMethodPath.TAG_LIST })
  if (res) restSearchTags.value = res
  isAddingLoading.value = false
}

const addBookmarkTag = async (params: { tagName?: string; tagId?: number }) => {
  const { tagName, tagId } = params
  if (!tagName && !tagId) return
  if (tagName && tagId) return

  // LF：本地建标签 + 关联，仅认 bookmarkUuid
  if (tagSrc) {
    isAddingLoading.value = true
    try {
      let tagUuid = tagId ? String(tagId) : ''
      if (!tagUuid && tagName) {
        const created = await tagSrc.createUserTag(tagName)
        tagUuid = String(created.id)
      }
      if (tagUuid) await tagSrc.add(props.bookmarkUuid, tagUuid)
    } finally {
      isAddingLoading.value = false
      isAddingTag.value = false
    }
    return
  }

  // 非 LF REST：保留 bookmark_uid（owner 在 bookmarkId=0 时靠它增删）
  if (!props.bookmarkId && !props.bookmarkUid) return
  isAddingLoading.value = true
  const res = await request().post<BookmarkTag>({
    url: RESTMethodPath.ADD_BOOKMARK_TAG,
    body: { bookmark_id: props.bookmarkId || undefined, bookmark_uid: props.bookmarkUid || undefined, tag_id: tagId, tag_name: tagName }
  })
  if (res) {
    restBookmarkTags.value.push(res)
    restSearchTags.value.push({ ...res })
  }
  isAddingLoading.value = false
  isAddingTag.value = false
}

const deleteBookmarkTag = async (tagId: number) => {
  // LF：本地解除标签关联
  if (tagSrc) {
    await tagSrc.remove(props.bookmarkUuid, String(tagId))
    return
  }

  // 非 LF REST：保留 bookmark_uid
  if (!props.bookmarkId && !props.bookmarkUid) return
  request().post<{ ok: boolean }>({
    url: RESTMethodPath.DELETE_BOOKMARK_TAG,
    body: { bookmark_id: props.bookmarkId || undefined, bookmark_uid: props.bookmarkUid || undefined, tag_id: tagId }
  })
  const index = restBookmarkTags.value.findIndex(tag => tag.id === tagId)
  if (index > -1) restBookmarkTags.value.splice(index, 1)
}

const onKeyDown = async (e: KeyboardEvent) => {
  if (e.key !== 'Enter' || !isAddingTag.value) return
  if (bookmarkTags.value.find(tag => tag.show_name === searchText.value)) {
    isAddingTag.value = false
    return
  }
  const tag = searchTags.value.find(tag => tag.show_name === searchText.value)
  if (tag) {
    await addBookmarkTag({ tagId: tag.id })
    isAddingTag.value = false
    return
  }
  await addBookmarkTag({ tagName: searchText.value })
  isAddingTag.value = false
}

const searchTagClick = async (tagId: number) => {
  await addBookmarkTag({ tagId })
}

const addingTagClick = (e: MouseEvent) => {
  e.stopPropagation()
  isAddingTag.value = !isAddingTag.value
}
</script>

<style lang="scss" scoped>
.bookmark-tags {
  --style: relative;
}

.tags-list {
  --style: flex flex-wrap items-center gap-8px;
}

.tag {
  display: flex;
  align-items: center;
  padding: 4px 10px;
  font-size: 13px;
  color: var(--slax-text-muted);
  background: transparent;
  border: 1px solid var(--slax-border);
  border-radius: 6px;
  cursor: default;
  transition: all 0.15s;

  .tag-name {
    --style: 'max-w-150px overflow-hidden whitespace-nowrap text-ellipsis';
  }

  .tag-remove {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 14px;
    border: none;
    background: none;
    cursor: pointer;
    color: var(--slax-text-light);
    border-radius: 3px;
    transition: all 0.15s;
    border-left: 1px solid var(--slax-border);
    opacity: 0;
    width: 0;
    padding: 0;
    margin: 0;
    overflow: hidden;
  }

  &:hover .tag-remove {
    opacity: 1;
    width: 14px;
    margin-left: 6px;
    padding-left: 6px;
  }

  .tag-remove:hover {
    color: var(--slax-accent);
  }
}

.loading {
  --style: flex-center h-24px;
}

.tag-add {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px dashed var(--slax-border);
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  color: var(--slax-text-light);
  transition: all 0.15s;

  &:hover {
    border-color: var(--slax-accent);
    color: var(--slax-accent);
    background: var(--slax-accent-bg);
  }

  svg {
    width: 14px;
    height: 14px;
  }
}

.search-list {
  --style: absolute top-full -mt-2px w-260px rounded-sm overflow-hidden border-(1px solid border) shadow-warm bg-surface-solid px-12px py-16px pb-12px z-10;

  input {
    --style: rounded-sm bg-surface border-(1px solid border) px-10px py-9px h-36px text-(aux txt-light) line-height-18px w-full transition-all duration-300;

    &:focus {
      border-color: var(--slax-accent-soft);
      color: var(--slax-text);
      outline: none;
    }
  }

  .search-result {
    --style: mt-12px overflow-y-scroll relative;

    .result-wrapper {
      --style: max-h-422px py-4px overflow-y-scroll;

      .search-tag {
        --style: 'rounded-sm flex items-center justify-between cursor-pointer px-10px py-9px not-first:(mt-6px) transition-all duration-normal whitespace-nowrap';
        border: 1px solid var(--slax-border);
        color: var(--slax-text-muted);
        font-size: var(--slax-fs-meta);

        &:hover {
          border-color: var(--slax-accent-soft);
          background: var(--slax-accent-bg);
        }

        .ai {
          --style: bg-contain w-16px h-16px shrink-0;
          background-image: url('@images/cell-ai-style-icon.png');
        }
      }
    }
  }

  .list-loading {
    --style: absolute inset-0 flex-center;
    background: color-mix(in srgb, var(--slax-surface-solid) 80%, transparent);
  }
}

.cell-leave-to,
.cell-enter-from {
  opacity: 0;
  max-width: 0;
  padding-top: 2px;
  padding-bottom: 2px;
  margin-right: 0;
  overflow: hidden;
}

.cell-enter-active,
.cell-leave-active {
  transition: all 0.25s ease-in-out;
  overflow: hidden;
}

.opacity-enter-from,
.opacity-leave-to {
  --style: opacity-0;
}

.opacity-enter-active,
.opacity-leave-active {
  --style: transition-opacity duration-fast;
}
</style>
