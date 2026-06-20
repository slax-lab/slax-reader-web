<template>
  <div class="tag-add-wrap">
    <button ref="add" class="tag-add" :title="$t('common.operate.add')" @click="toggle">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <line x1="5" y1="1" x2="5" y2="9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <line x1="1" y1="5" x2="9" y2="5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>
    <!-- 面板自带 isAddingTag/searchText/候选过滤等全部本地状态：
         开关面板只重渲染本组件，绝不重渲染父级 BookmarkTags（chips 的拥有者），
         从而父级 .tags-list block 在加标签流程中无任何结构挂卸，chips 的 el 不会被置 null。 -->
    <Teleport to="body">
      <div v-show="isAddingTag" class="search-list" ref="searchList" v-on-click-outside="[() => (isAddingTag = false), { ignore: [add] }]">
        <input
          ref="searchInput"
          type="text"
          :placeholder="$t('component.bookmark_tags.placeholder')"
          v-model="searchText"
          v-on-key-stroke:Enter="[onKeyDown, { eventName: 'keydown' }]"
        />
        <div class="search-result">
          <div class="result-wrapper">
            <div v-if="searchResultTags.length" class="search-tags-cells">
              <div class="search-tag" v-for="tag in searchResultTags" :key="tag.id" @click="onPick(tag.id)">
                <span>{{ tag.show_name }}</span>
                <i class="ai" v-if="tag.system" />
              </div>
            </div>
          </div>
        </div>
        <div class="list-loading" v-if="busy">
          <div class="i-svg-spinners:90-ring w-24px" style="color: var(--slax-accent)" />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts" setup>
import type { BookmarkTag } from '@commons/types/interface'
import { vOnClickOutside, vOnKeyStroke } from '@vueuse/components'

const props = defineProps<{
  // 候选标签源（全部用户标签）；本组件按已选 + 关键词过滤
  searchTags: BookmarkTag[]
  // 书签当前已选标签 id（从候选中剔除）
  currentTagIds: (number | string)[]
}>()

const emit = defineEmits<{
  pickTag: [tagId: number]
  createTag: [tagName: string]
  open: []
}>()

const add = ref<HTMLButtonElement>()
const searchList = ref<HTMLDivElement>()
const searchInput = ref<HTMLInputElement>()

const isAddingTag = ref(false)
const searchText = ref('')
// 写入进行中转圈，状态本地持有：避免父级 BookmarkTags 因 loading 变化而重渲染
// （父级重渲染会 patch .tags-list block，进而把 chips 的 fragment 锚点从 DOM 卸下 → 新标签插不进去）
const busy = ref(false)

const filteredSearchTags = computed(() => props.searchTags.filter(tag => props.currentTagIds.indexOf(tag.id) === -1))
const searchResultTags = computed(() => {
  if (!searchText.value) return filteredSearchTags.value
  return filteredSearchTags.value.filter(tag => tag.show_name.includes(searchText.value))
})

const dbg = (m: string) => {
  if (typeof window !== 'undefined') (window as any).__taglog?.(`AddPanel ${m}`)
}
onBeforeUpdate(() => dbg('hook onBeforeUpdate'))
onErrorCaptured((err, _i, info) => {
  dbg(`onErrorCaptured info=${info} msg=${(err as any)?.message}`)
  return undefined
})

const toggle = (e: MouseEvent) => {
  e.stopPropagation()
  dbg(`toggle ${isAddingTag.value} -> ${!isAddingTag.value} cand=${searchResultTags.value.length}`)
  isAddingTag.value = !isAddingTag.value
}

watch(
  () => isAddingTag.value,
  value => {
    if (value) {
      emit('open')
      nextTick(() => {
        const rect = add.value?.getBoundingClientRect()
        if (rect && searchList.value) {
          searchList.value.style.top = `${rect.bottom + 10}px`
          searchList.value.style.left = `${rect.left}px`
        }
        searchInput.value?.focus()
      })
    } else {
      searchText.value = ''
    }
  }
)

const onPick = (tagId: number) => {
  dbg(`onPick ${tagId}`)
  busy.value = true
  emit('pickTag', tagId)
}

const onKeyDown = () => {
  if (!isAddingTag.value) return
  const text = searchText.value
  if (!text) return
  busy.value = true
  const existing = props.searchTags.find(tag => tag.show_name === text)
  if (existing) emit('pickTag', existing.id)
  else emit('createTag', text)
}

// 父级写入完成后调用以关闭面板 + 复位 busy
const close = () => {
  isAddingTag.value = false
  busy.value = false
}
defineExpose({ close })
</script>

<style lang="scss" scoped>
.tag-add-wrap {
  --style: relative;
}

// 不生成盒子，候选项按原布局排在 .result-wrapper 流内
.search-tags-cells {
  display: contents;
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
</style>
