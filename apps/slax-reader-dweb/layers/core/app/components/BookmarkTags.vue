<template>
  <div class="bookmark-tags">
    <div class="tags-list" :class="{ 'is-reserving': isReserving }">
      <!-- chips 与 add-panel 各自独立子组件：父级 .tags-list block 只含稳定的组件 vnode，
           加标签流程中无任何 v-if 结构挂卸 → 不会经 patchBlockChildren 把 chips 的 el 置 null
           （Vue 3.5.38 optimized block patch null-anchor 崩溃根因）。 -->
      <BookmarkTagChips :tags="bookmarkTags" :readonly="props.readonly" @remove="deleteBookmarkTag" />

      <div class="loading" v-if="isTagLoading">
        <div class="i-svg-spinners:90-ring w-16px" style="color: var(--slax-accent)" />
      </div>

      <BookmarkTagAddPanel
        v-if="!props.readonly"
        ref="addPanel"
        :search-tags="searchTags"
        :current-tag-ids="currentBookmarkTagIds"
        :loading="isAddingLoading"
        @open="searchingTags"
        @pick-tag="onPickTag"
        @create-tag="onCreateTag"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import BookmarkTagAddPanel from '#layers/core/app/components/BookmarkTagAddPanel.vue'
import BookmarkTagChips from '#layers/core/app/components/BookmarkTagChips.vue'

import { RESTMethodPath } from '@commons/types/const'
import type { BookmarkTag } from '@commons/types/interface'
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
  // LF 本地标签 key，BookmarkArticle 注入
  // 仅认 bookmarkUuid
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

// 本地标签源 + catalog；null 走 REST
const lf = inject(LocalFirstAdapterKey, null)
const tagSrc = lf?.bookmarkTagSource?.(computed(() => props.bookmarkUuid)) ?? null
const localActive = !!tagSrc

const addPanel = ref<{ close: () => void }>()

// 双轨：LF 只读 / REST ref
const restBookmarkTags = ref<BookmarkTag[]>(props.tags || [])
const restSearchTags = ref<BookmarkTag[]>([])
// LF 激活恒用本地源（避免 REST/LF 切源重挂崩溃）
const bookmarkTags = computed<BookmarkTag[]>(() => {
  console.log('cc: ', tagSrc!.tags.value)
  return localActive ? tagSrc!.tags.value : restBookmarkTags.value
})
const searchTags = computed<BookmarkTag[]>(() => (localActive ? tagSrc!.userTags.value : restSearchTags.value))

// LF 首查未返回，预留一行占位防跳动
const isReserving = computed(() => localActive && !!tagSrc?.isLoading?.value)

const isTagLoading = ref(false)
const isAddingLoading = ref(false)
const currentBookmarkTagIds = computed(() => bookmarkTags.value.map(tag => tag.id) || [])

// [TAGDBG] 临时调试（非 sync，避免干扰 patch 时序）；排查完删除
const dbg = (m: string) => {
  if (typeof window !== 'undefined') (window as any).__taglog?.(`BookmarkTags ${m}`)
}
dbg(`setup localActive=${localActive} uuid=${props.bookmarkUuid}`)
onMounted(() => dbg(`hook onMounted bm=${bookmarkTags.value.length}`))
onBeforeUpdate(() => dbg(`hook onBeforeUpdate bm=${bookmarkTags.value.length} loading=${isAddingLoading.value}`))
onUpdated(() => dbg('hook onUpdated'))
onBeforeUnmount(() => dbg('hook onBeforeUnmount'))
onErrorCaptured((err, _inst, info) => {
  dbg(`onErrorCaptured info=${info} msg=${(err as any)?.message}`)
  return undefined
})

watch(
  () => props.tags,
  newTags => {
    if (localActive) return // LF：不接 props.tags
    restBookmarkTags.value = newTags
  },
  { deep: true }
)

// REST 模式下打开面板时拉候选；LF 模式 early-return（候选走 userTags）
const searchingTags = async () => {
  if (localActive) return
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

  // LF：本地建标签 + 关联
  if (tagSrc) {
    dbg(`add LF enter tagId=${tagId} tagName=${tagName}`)
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
      addPanel.value?.close()
      dbg(`add LF done bm=${bookmarkTags.value.length}`)
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
  addPanel.value?.close()
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

// 选中已存在标签：若已在书签上则仅关闭，否则关联
const onPickTag = async (tagId: number) => {
  if (bookmarkTags.value.find(tag => tag.id === tagId)) {
    addPanel.value?.close()
    return
  }
  await addBookmarkTag({ tagId })
}

// 新建并关联：同名已在书签上则仅关闭
const onCreateTag = async (tagName: string) => {
  if (bookmarkTags.value.find(tag => tag.show_name === tagName)) {
    addPanel.value?.close()
    return
  }
  await addBookmarkTag({ tagName })
}
</script>

<style lang="scss" scoped>
.bookmark-tags {
  --style: relative;
}

.tags-list {
  --style: flex flex-wrap items-center gap-8px;

  // 预留一行高度
  &.is-reserving {
    min-height: 28px;
  }
}

.loading {
  --style: flex-center h-24px;
}
</style>
