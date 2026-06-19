<template>
  <div class="bookmark-tags">
    <div class="tags-list" :class="{ 'is-reserving': isReserving }">
      <!-- 标签 chips 抽成独立子组件：keyed v-for 在自己的渲染 block 内，
           不被父 block 内 .search-list 卸载误伤 el（Vue 3.5 block patch null-anchor 崩溃根因） -->
      <BookmarkTagChips :tags="bookmarkTags" :readonly="props.readonly" @remove="deleteBookmarkTag" />

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
        <!-- 面板 Teleport 到 body：把它从 .tags-list block 移走。
             其 v-if 挂卸只发生在 body，不再破坏同 block 内 chips 的 el
             （Vue 3.5 optimized block patch null-anchor 崩溃根因）。
             Teleport 占位节点常驻 block，故 block 结构稳定。 -->
        <Teleport to="body">
          <!-- ignore:[add]：Teleport 后 + 按钮不在面板内，否则点 + 会被判为 outside 先关再开 -->
          <div v-if="isAddingTag" class="search-list" ref="searchList" v-on-click-outside="[() => (isAddingTag = false), { ignore: [add] }]">
            <input
              ref="searchInput"
              type="text"
              :placeholder="$t('component.bookmark_tags.placeholder')"
              v-model="searchText"
              v-on-key-stroke:Enter="[onKeyDown, { eventName: 'keydown' }]"
            />
            <div class="search-result">
              <div class="result-wrapper">
                <!-- v-if 真实 div：候选列表 0↔N 整块挂卸，避开空 fragment 就地 patch（null-anchor）崩溃 -->
                <div v-if="searchResultTags.length" class="search-tags-cells">
                  <div class="search-tag" v-for="tag in searchResultTags" :key="tag.id" @click="searchTagClick(tag.id)">
                    <span>{{ tag.show_name }}</span>
                    <i class="ai" v-if="tag.system" />
                  </div>
                </div>
              </div>
            </div>
            <div class="list-loading" v-if="isAddingLoading">
              <div class="i-svg-spinners:90-ring w-24px" style="color: var(--slax-accent)" />
            </div>
          </div>
        </Teleport>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BookmarkTagChips from '#layers/core/app/components/BookmarkTagChips.vue'

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

const add = ref<HTMLButtonElement>()
const searchList = ref<HTMLDivElement>()
const searchInput = ref<HTMLInputElement>()

// 双轨：LF 只读 / REST ref
const restBookmarkTags = ref<BookmarkTag[]>(props.tags || [])
const restSearchTags = ref<BookmarkTag[]>([])
// LF 激活恒用本地源
// 避免 REST/LF 切源重挂崩溃
const bookmarkTags = computed<BookmarkTag[]>(() => (localActive ? tagSrc!.tags.value : restBookmarkTags.value))
const searchTags = computed<BookmarkTag[]>(() => (localActive ? tagSrc!.userTags.value : restSearchTags.value))

// LF 首查未返回，预留一行占位防跳动
const isReserving = computed(() => localActive && !!tagSrc?.isLoading?.value)

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

// [TAGDBG] 临时调试：标签组件反应式时间线（排查 /b/[id] 首访加标签崩溃，排查完删除）
const dbg = (m: string) => {
  if (typeof window !== 'undefined') (window as any).__taglog?.(`BookmarkTags ${m}`)
}
dbg(`setup localActive=${localActive} uuid=${props.bookmarkUuid}`)
watch(
  () => ({
    adding: isAddingTag.value,
    loading: isAddingLoading.value,
    cand: searchResultTags.value.length,
    bm: bookmarkTags.value.length,
    user: searchTags.value.length,
    text: searchText.value
  }),
  (v, o) => dbg(`state ${JSON.stringify(o)} -> ${JSON.stringify(v)}`),
  { flush: 'sync' }
)

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
      // v-if 弹层，nextTick 再定位/聚焦
      nextTick(() => {
        // 面板已 Teleport 到 body：position:fixed + 视口坐标定位，
        // 不依赖滚动容器是 window（页面在容器内滚动也不会错位；面板为瞬时弹层，点外即关）。
        const rect = add.value?.getBoundingClientRect()
        if (rect && searchList.value) {
          searchList.value.style.top = `${rect.bottom + 10}px`
          searchList.value.style.left = `${rect.left}px`
        }
        searchInput.value?.focus()
      })
      searchingTags()
    } else {
      searchText.value = ''
    }
  }
)

// [TAGDBG] 生命周期 / 渲染触发 / 错误捕获埋点
onBeforeMount(() => dbg('hook onBeforeMount'))
onMounted(() => dbg(`hook onMounted cand=${searchResultTags.value.length} bm=${bookmarkTags.value.length} adding=${isAddingTag.value}`))
onBeforeUpdate(() => dbg(`hook onBeforeUpdate cand=${searchResultTags.value.length} bm=${bookmarkTags.value.length} adding=${isAddingTag.value} loading=${isAddingLoading.value}`))
onUpdated(() => dbg('hook onUpdated'))
onBeforeUnmount(() => dbg('hook onBeforeUnmount'))
onUnmounted(() => dbg('hook onUnmounted'))
onErrorCaptured((err, _inst, info) => {
  dbg(`onErrorCaptured info=${info} msg=${(err as any)?.message}`)
  return undefined
})
// onRenderTriggered 仅 dev 构建生效（关压缩若同时是 dev 模式则会打印是哪个响应式依赖触发了重渲染）
try {
  if (typeof onRenderTriggered === 'function') onRenderTriggered(e => dbg(`renderTriggered type=${(e as any).type} key=${String((e as any).key)}`))
} catch {}

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

  // LF：本地建标签 + 关联
  if (tagSrc) {
    dbg(`addBookmarkTag LF enter tagId=${tagId} tagName=${tagName} cand=${searchResultTags.value.length}`)
    isAddingLoading.value = true
    try {
      let tagUuid = tagId ? String(tagId) : ''
      if (!tagUuid && tagName) {
        dbg('createUserTag start')
        const created = await tagSrc.createUserTag(tagName)
        tagUuid = String(created.id)
        dbg(`createUserTag done id=${tagUuid} cand=${searchResultTags.value.length}`)
      }
      if (tagUuid) {
        dbg(`add start cand=${searchResultTags.value.length}`)
        await tagSrc.add(props.bookmarkUuid, tagUuid)
        dbg(`add done cand=${searchResultTags.value.length} bm=${bookmarkTags.value.length}`)
      }
    } finally {
      isAddingLoading.value = false
      dbg(`finally set isAddingTag=false (was ${isAddingTag.value}) cand=${searchResultTags.value.length}`)
      isAddingTag.value = false
    }
    return
  }

  // 非 LF REST：保留 bookmark_uid
  // owner 在 bookmarkId=0 时靠它增删
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
  dbg(`onKeyDown Enter text="${searchText.value}"`)
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
  dbg(`searchTagClick tagId=${tagId}`)
  await addBookmarkTag({ tagId })
}

const addingTagClick = (e: MouseEvent) => {
  e.stopPropagation()
  dbg(`addingTagClick toggle ${isAddingTag.value} -> ${!isAddingTag.value} cand=${searchResultTags.value.length} user=${searchTags.value.length}`)
  isAddingTag.value = !isAddingTag.value
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

// 标签 chips 的 .tags-cells / .tag 等样式已随模板迁移到 BookmarkTagChips.vue

// 同范式：不生成盒子，.search-tag 仍按原布局排在 .result-wrapper 流内
.search-tags-cells {
  display: contents;
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
  // Teleport 到 body：position:fixed + JS 设视口坐标；z 提高以盖住正文
  --style: fixed w-260px rounded-sm overflow-hidden border-(1px solid border) shadow-warm bg-surface-solid px-12px py-16px pb-12px z-1000;

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
