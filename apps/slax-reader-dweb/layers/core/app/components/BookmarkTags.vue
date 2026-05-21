<template>
  <div class="bookmark-tags" ref="bookmarkTagsEle">
    <div class="list-container">
      <TransitionGroup name="cell">
        <div class="tag" v-for="tag in bookmarkTags" :key="tag.show_name" :class="{ group: !props.readonly }">
          <span> {{ tag.show_name }} </span>
          <button v-if="!props.readonly" class="!group-hover:visible !group-hover:opacity-100" @click="deleteBookmarkTag(tag.id)">
            <i class="seperator"></i>
            <img src="@images/tiny-cross-gold-icon.png" alt="" />
          </button>
        </div>
      </TransitionGroup>
      <div class="loading" v-if="isTagLoading">
        <div class="i-svg-spinners:90-ring w-24px color-#f4c982"></div>
      </div>
      <div class="operate" v-if="!props.readonly">
        <button ref="add" class="add" @click="addingTagClick">
          <img src="@images/tiny-plus-icon.png" alt="" />
        </button>
        <Transition name="opacity">
          <div class="search-list" ref="searchList" v-show="isAddingTag" v-on-click-outside="() => (isAddingTag = false)">
            <input type="text" :placeholder="$t('component.bookmark_tags.placeholder')" v-model="searchText" v-on-key-stroke:Enter="[onKeyDown, { eventName: 'keydown' }]" />
            <div class="search-result">
              <div class="result-wrapper">
                <div class="search-tag" :class="{ 'ai-style': true }" v-for="tag in searchResultTags" :key="tag.id" @click="searchTagClick(tag.id)">
                  <span>{{ tag.show_name }}</span>
                  <i class="ai" v-if="tag.system"></i>
                </div>
              </div>
            </div>
            <div class="list-loading" v-if="isAddingLoading">
              <div class="i-svg-spinners:90-ring w-24px color-#f4c982"></div>
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

const props = defineProps({
  bookmarkId: {
    type: Number,
    required: false
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

const bookmarkTagsEle = ref<HTMLDivElement>()
const add = ref<HTMLButtonElement>()
const searchList = ref<HTMLDivElement>()

const bookmarkTags = ref<BookmarkTag[]>(props.tags || [])
const searchTags = ref<BookmarkTag[]>([])

const isTagLoading = ref(false)
const isAddingLoading = ref(false)
const isAddingTag = ref(false)
const searchText = ref('')
const currentBookmarkTagIds = computed(() => bookmarkTags.value.map(tag => tag.id) || [])

const filteredSearchTags = computed(() => {
  const filters = searchTags.value.filter(tag => currentBookmarkTagIds.value.indexOf(tag.id) === -1)
  return filters
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
    bookmarkTags.value = newTags
  },
  { deep: true }
)

watch(
  () => isAddingTag.value,
  value => {
    if (value) {
      const eleRect = bookmarkTagsEle.value?.getBoundingClientRect()
      const rect = add.value?.getBoundingClientRect()
      console.log(eleRect, rect)
      if (eleRect && rect && searchList.value) {
        const yOffset = rect.bottom - eleRect.top + 10
        const xOffset = Math.min(rect.left - eleRect.left, eleRect.width - 200)

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
  if (isAddingLoading.value) {
    return
  }

  isAddingLoading.value = true
  const res = await request().get<BookmarkTag[]>({
    url: RESTMethodPath.TAG_LIST
  })

  if (res) {
    searchTags.value = res
  }

  isAddingLoading.value = false
}

const addBookmarkTag = async (params: { tagName?: string; tagId?: number }) => {
  if (!props.bookmarkId) {
    return
  }

  const { tagName, tagId } = params

  if (!tagName && !tagId) return
  if (tagName && tagId) return

  isAddingLoading.value = true

  const res = await request().post<BookmarkTag>({
    url: RESTMethodPath.ADD_BOOKMARK_TAG,
    body: {
      bookmark_id: props.bookmarkId,
      tag_id: tagId,
      tag_name: tagName
    }
  })

  if (res) {
    bookmarkTags.value.push(res)
    searchTags.value.push({ ...res })
  }

  isAddingLoading.value = false
  isAddingTag.value = false
}

const deleteBookmarkTag = async (tagId: number) => {
  if (!props.bookmarkId) {
    return
  }

  request().post<{ ok: boolean }>({
    url: RESTMethodPath.DELETE_BOOKMARK_TAG,
    body: {
      bookmark_id: props.bookmarkId,
      tag_id: tagId
    }
  })

  const index = bookmarkTags.value.findIndex(tag => tag.id === tagId)
  if (index > -1) {
    bookmarkTags.value.splice(index, 1)
  }
}

const onKeyDown = async (e: KeyboardEvent) => {
  if (e.key !== 'Enter' || !isAddingTag.value) {
    return
  }

  if (bookmarkTags.value.find(tag => tag.show_name === searchText.value)) {
    isAddingTag.value = false
    return
  }

  const tag = searchTags.value.find(tag => tag.show_name === searchText.value)
  if (tag) {
    await addBookmarkTag({
      tagId: tag.id
    })

    isAddingTag.value = false
    return
  }

  await addBookmarkTag({
    tagName: searchText.value
  })

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
  --style: relative -mb-10px;

  .list-container {
    --style: w-full flex flex-wrap;

    & > * {
      --style: 'not-last:mr-10px';
    }

    .tag {
      --style: relative flex-center flex-wrap border-(1px solid #e4d6ba) rounded-4px h-24px py-2px px-4px transition-all duration-250 mb-10px max-w-250px whitespace-nowrap;

      // &.group:hover { // 暂时让关闭按钮永久显示
      &.group {
        --style: pr-29px;
      }

      span {
        --style: text-(13px #a28d64) line-height-18px text-ellipsis overflow-hidden;
      }

      button {
        --style: 'absolute right-3px top-0 w-16px h-full flex-center hover:scale-105 transition-all duration-250 active:scale-110 opacity-100';
        .seperator {
          --style: absolute -left-3px top-1/2 -translate-y-1/2 w-1px h-10px bg-#0f141914;
        }

        img {
          --style: w-16px h-16px object-fit;
        }
      }
    }

    .loading {
      --style: flex-center h-24px;
    }

    .operate {
      // --style: relative;

      button {
        --style: bg-#a28d6414 rounded-4px w-24px h-24px flex-center;
        img {
          --style: w-10px h-10px;
        }
      }

      .search-list {
        --style: absolute top-full -mt-2px w-260px rounded-8px overflow-hidden border-(1px solid #3333330d) shadow-[0px_20px_60px_0px_#0000000a] bg-#fff px-12px py-16px pb-12px
          z-10;

        input {
          --style: rounded-6px bg-#fcfcfc border-(1px solid #3333330d) px-10px py-9px h-36px text-(13px #999) line-height-18px w-full transition-all duration-300;

          &:focus {
            --style: border-(1.5px #f4c982) text-#A28D64;
          }
        }

        .search-result {
          --style: mt-12px overflow-y-scroll relative;
          &::before,
          &::after {
            --style: z-2 content-empty absolute h-4px w-full left-0 from-#fff to-transprent;
          }

          &::before {
            --style: bottom-0 bg-gradient-to-t;
          }

          &::after {
            --style: top-0 bg-gradient-to-b;
          }

          .result-wrapper {
            --style: max-h-422px py-4px overflow-y-scroll;

            .search-tag {
              --style: 'border-(1px solid #e4d6ba) rounded-6px flex items-center justify-between cursor-pointer px-10px py-9px not-first:(mt-6px) transition-all duration-250 whitespace-nowrap';
              span {
                --style: text-(15px #a28d64) line-height-16px text-ellipsis overflow-hidden;
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
          }
        }

        .list-loading {
          --style: absolute inset-0 flex-center bg-#ffffff99;
        }
      }
    }
  }
}

.cell-leave-to,
.cell-enter-from {
  --style: 'opacity-0 !max-w-0 !py-2px !mr-0px';
}

.cell-enter-active,
.cell-leave-active {
  --style: transition-all duration-250 ease-in-out;
}
</style>
