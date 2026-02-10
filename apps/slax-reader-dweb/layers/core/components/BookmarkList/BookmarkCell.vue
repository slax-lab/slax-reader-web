<template>
  <div class="bookmark-cell" :class="{ deleting: isDeleting }">
    <div class="index" v-if="index !== undefined">{{ index + 1 }}.</div>
    <div class="main-content">
      <div class="cell-content">
        <div class="cell-header">
          <button v-if="!isEditingTitle" class="title" :class="{ stroking: isStroking }" @click="clickTitle">
            {{ bookmark.alias_title || bookmark.title || bookmark.target_url }}
          </button>
          <input
            ref="input"
            type="text"
            v-else
            v-model="editingTitle"
            :placeholder="$t('component.bookmark_cell.edit_title_placeholder')"
            @input="handleInput"
            v-on-key-stroke:Enter="[onKeyDown, { eventName: 'keydown' }]"
            v-on-click-outside="[
              () => {
                onClickoutside()
              },
              { ignore: [editTitleButton] }
            ]"
          />
          <template v-if="!isTrashed && !isSubscribe">
            <button
              class="star bg-[length:11px_11px] bg-[url('@images/tiny-star-disable.png')] bg-center"
              :class="{ enabled: isStarred }"
              @click="starBookmark(!isStarred)"
            ></button>
            <!-- <template v-if="bookmark.status === 'failed' && !haveRetried">
              <i class="seperator"></i>
              <button class="retry" v-if="!isRetrying" @click="retryBookmark">{{ $t('common.operate.refetch') }}</button>
              <div class="i-svg-spinners:90-ring w-12px color-#5490c2" v-else></div>
            </template> -->
          </template>
        </div>
        <div class="cell-footer">
          <span class="date">{{ dateString }}</span>
          <i class="seperator"></i>
          <template v-if="bookmark.type === 'shortcut'">
            <button class="href" @click="clickHref">
              <img src="@images/tiny-href-fill-icon.png" />
              <span class="ml-4px">
                {{ getSiteName() }}
              </span>
            </button>
          </template>
          <template v-else>
            <button class="href" @click="clickHref">
              <img src="@images/tiny-link-outline-icon.png" />
              <span class="ml-4px">
                {{ getSiteName() }}
              </span>
            </button>
            <template v-if="!isSubscribe">
              <i class="seperator"></i>
              <button class="href snapshot" @click="clickCache">
                <img src="@images/tiny-link-outline-icon.png" />
                <span class="ml-4px">
                  {{ $t('common.operate.snapshot') }}
                </span>
              </button>
            </template>
          </template>

          <template v-if="!isSubscribe">
            <template v-if="!isTrashed">
              <button class="edit" ref="editTitleButton" @click="clickEdit">
                {{ !isEditingTitle ? $t('common.operate.edit_title') : $t('common.operate.cancel_edit_title') }}
              </button>
              <i class="seperator"></i>
              <button
                v-if="['inbox', 'archive'].indexOf(bookmark.archived) !== -1 && !isArchiving"
                class="archieve"
                ref="archieveButton"
                :class="{ hover: isArchieveHovered }"
                @click="archiveBookmark(bookmark.archived === 'inbox')"
              >
                {{ bookmark.archived === 'inbox' ? $t('common.operate.archive') : $t('common.operate.unarchive') }}
              </button>
              <div class="i-svg-spinners:90-ring ml-20px w-12px color-#5490c2" v-else-if="isArchiving"></div>
              <i class="seperator"></i>
              <button class="delete" ref="deleteButton" :class="{ hover: isDeleteHovered }" @click="clickDelete">{{ $t('common.operate.trashed') }}</button>
            </template>
            <template v-else>
              <button class="revert" ref="revertButton" :class="{ hover: isRevertHovered }" @click="clickRevert">{{ $t('common.operate.revert_to_inbox') }}</button>
            </template>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { urlHttpString } from '@commons/utils/string'

import { RESTMethodPath } from '@commons/types/const'
import { type BookmarkItem, BookmarkParseStatus, type EmptyBookmarkResp } from '@commons/types/interface'
import { vOnClickOutside, vOnKeyStroke } from '@vueuse/components'
import { formatDate } from '@vueuse/core'
import { showSnapshotStatusModal } from '#layers/core/components/Modal'
import Toast, { ToastType } from '#layers/core/components/Toast'

const { t } = useI18n()
const props = defineProps({
  index: {
    type: Number,
    required: false
  },
  bookmark: {
    type: Object as PropType<BookmarkItem>,
    required: true
  },
  isSubscribe: {
    type: Boolean,
    required: true
  },
  collectionCode: {
    type: String,
    required: false
  }
})

const { index, bookmark } = toRefs(props)
const emits = defineEmits(['delete', 'archiveUpdate', 'aliasTitleUpdate', 'bookmarkUpdate'])
const route = useRoute()
const isDeleting = ref(false)
const isStroking = ref(false)
const isRetrying = ref(false)
const isArchiving = ref(false)
const isEditingTitle = ref(false)
const haveRetried = ref(false)
const input = ref<HTMLInputElement | null>(null)
const editTitleButton = useTemplateRef('editTitleButton')
const editingTitle = ref('')
const archieveButton = ref<HTMLButtonElement>()
const isArchieveHovered = useElementHover(archieveButton)
const deleteButton = ref<HTMLButtonElement>()
const isDeleteHovered = useElementHover(deleteButton)
const revertButton = ref<HTMLButtonElement>()
const isRevertHovered = useElementHover(revertButton)

const getCurrentSection = (): 'inbox' | 'starred' | 'topics' | 'archive' | 'trash' | 'notifications' => {
  const filter = String(route.query.filter || 'inbox')
  const sectionMap: Record<string, 'inbox' | 'starred' | 'topics' | 'archive' | 'trash' | 'notifications'> = {
    inbox: 'inbox',
    starred: 'starred',
    topics: 'topics',
    archive: 'archive',
    trashed: 'trash',
    notifications: 'notifications'
  }
  return sectionMap[filter] || 'inbox'
}

const trackListItemInteract = (element: 'title' | 'orginal' | 'snapshot' | 'edit_title' | 'star' | 'archive' | 'trash') => {
  analyticsLog({
    event: 'bookmark_list_item_interact',
    bookmark_id: bookmark.value.id,
    element,
    section: getCurrentSection()
  })
}

const isTrashed = computed(() => {
  return !!props.bookmark.trashed_at
})

const isRequesting = computed(() => {
  return isDeleting.value || isRetrying.value || isArchiving.value || isStroking.value
})

const dateString = computed(() => {
  if (bookmark.value.trashed_at) {
    return formatDate(new Date(bookmark.value.trashed_at), 'YYYY-MM-DD')
  }

  const date = bookmark.value.published_at ? bookmark.value.created_at : ''
  if (!date || date.length === 0) {
    return '--'
  }

  return formatDate(new Date(date), 'YYYY-MM-DD')
})

const urlString = computed(() => {
  return urlHttpString(bookmark.value.target_url)
})

const isStarred = computed(() => {
  return bookmark.value.starred === 'star'
})

watch(
  () => isEditingTitle.value,
  value => {
    if (!value) {
      editingTitle.value = ''
    }
  }
)

const clickTitle = () => {
  if (isDeleting.value || isStroking.value) {
    return
  }

  trackListItemInteract('title')

  if (props.isSubscribe) {
    pwaOpen({
      url: `/c/${props.collectionCode}/${bookmark.value.id}`,
      target: '_blank'
    })
    return
  }

  if (bookmark.value.status !== 'success' || bookmark.value.type === 'shortcut') {
    clickHref()
    return
  }

  if (document?.querySelector('slax-reader-panel')) {
    // pwaOpen({
    //   url: '/w/' + String(bookmark.value.id)
    // })

    clickHref()
  } else {
    clickCache()
  }
}

const clickHref = () => {
  if (isRequesting.value) {
    return
  }

  trackListItemInteract('orginal')

  window.open(urlString.value, '_blank')
}

const clickCache = () => {
  if (isRequesting.value) {
    return
  }

  trackListItemInteract('snapshot')

  if (bookmark.value.status !== BookmarkParseStatus.SUCCESS) {
    const reminderKey = `snapshot_reminder_disabled_${bookmark.value.status}`
    const isReminderDisabled = localStorage.getItem(reminderKey) === 'true'

    if (!isReminderDisabled) {
      showSnapshotStatusModal({
        status: bookmark.value.status,
        title: getSnapshotModalTitle(bookmark.value.status),
        content: getSnapshotModalContent(bookmark.value.status),
        onConfirm: (dontRemindAgain: boolean) => {
          if (dontRemindAgain) {
            localStorage.setItem(reminderKey, 'true')
          }
          clickHref()
        }
      })
    } else {
      clickHref()
    }
    return
  }

  pwaOpen({
    url: '/bookmarks/' + String(bookmark.value.id)
  })
}

const getSnapshotModalTitle = (status: BookmarkParseStatus) => {
  if (status === BookmarkParseStatus.FAILED) {
    return t('component.snapshot_status_modal.failed_title')
  } else {
    return t('component.snapshot_status_modal.pending_title')
  }
}

const getSnapshotModalContent = (status: BookmarkParseStatus) => {
  if (status === BookmarkParseStatus.FAILED) {
    return t('component.snapshot_status_modal.failed_content')
  } else {
    return t('component.snapshot_status_modal.pending_content')
  }
}

const clickEdit = () => {
  if (isRequesting.value) {
    return
  }

  trackListItemInteract('edit_title')

  isEditingTitle.value = !isEditingTitle.value

  if (isEditingTitle.value) {
    editingTitle.value = bookmark.value.alias_title || bookmark.value.title
    nextTick(() => {
      handleInput()
    })
  }
}

const getSiteName = () => {
  const siteName = bookmark.value.site_name || bookmark.value.host_url
  return bookmark.value.type === 'shortcut' ? t('component.bookmark_cell.shortcut') + ' ' + siteName : siteName
}

const archiveBookmark = async (archive: boolean) => {
  if (isRequesting.value) {
    return
  }

  trackListItemInteract('archive')

  isArchiving.value = true
  try {
    await request().post<{ bookmark_id: number; status: string }>({
      url: RESTMethodPath.BOOKMARK_ARCHIVE,
      body: {
        bookmark_id: bookmark.value.id,
        status: archive ? 'archive' : 'inbox'
      }
    })

    Toast.showToast({
      text: t(archive ? 'common.tips.archive_success' : 'common.tips.unarchive_success'),
      type: ToastType.Success
    })

    emits('archiveUpdate', bookmark.value.id, archive)

    analyticsLog({
      event: 'bookmark_archive',
      is_archived: archive,
      source: 'inbox'
    })
  } catch (e) {
    console.log(e)
    Toast.showToast({
      text: t('common.tips.operate_failed'),
      type: ToastType.Error
    })
  }

  isArchiving.value = false
}

const retryBookmark = async () => {
  if (isRequesting.value) {
    return
  }

  isRetrying.value = true
  try {
    await request().post<{ bookmark_id: number; status: string }>({
      url: RESTMethodPath.ADD_URL_BOOKMARK,
      body: {
        target_url: urlHttpString(bookmark.value.target_url)
      }
    })
    Toast.showToast({
      text: t('common.tips.refetch_success'),
      type: ToastType.Success
    })

    removeCell(false)
  } catch (err) {
    console.error(err)
  }

  isRetrying.value = false
}

const clickDelete = async (event: MouseEvent) => {
  event.stopPropagation()

  if (isRequesting.value) {
    return
  }

  trackListItemInteract('trash')
  analyticsLog({
    event: 'bookmark_delete'
  })

  if (isEditingTitle.value) {
    isEditingTitle.value = false
  }

  const id = bookmark.value.id
  request().post<EmptyBookmarkResp>({
    url: RESTMethodPath.TRASH_BOOKMARK,
    body: {
      bookmark_id: id
    }
  })

  removeCell(true)
}

const clickRevert = async () => {
  if (isRequesting.value) {
    return
  }

  trackListItemInteract('trash')

  const id = bookmark.value.id
  request().post<EmptyBookmarkResp>({
    url: RESTMethodPath.REVERT_BOOKMARK,
    body: {
      bookmark_id: id
    }
  })

  removeCell(false)
}

const removeCell = (stroke: boolean) => {
  if (stroke) {
    isStroking.value = true
    setTimeout(() => {
      isDeleting.value = true
      emits('delete', bookmark.value.id)
    }, 500)
  } else {
    isDeleting.value = true
    emits('delete', bookmark.value.id)
  }
}

const handleInput = () => {
  if (!input.value) {
    return
  }

  input.value.style.width = '16px'
  input.value.style.width = input.value.scrollWidth + 8 + 'px'
}

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key !== 'Enter' || !isEditingTitle.value) {
    return
  }

  updateBookmarkTitle()
}

const onClickoutside = () => {
  if (isEditingTitle.value) {
    updateBookmarkTitle()
  }
}

const updateBookmarkTitle = () => {
  if (editingTitle.value === bookmark.value.alias_title) {
    isEditingTitle.value = false
    return
  }

  const req = {
    bookmark_id: bookmark.value.id,
    alias_title: editingTitle.value
  }

  request().post({
    url: RESTMethodPath.BOOKMARK_ALIAS_TITLE,
    body: req
  })

  emits('bookmarkUpdate', bookmark.value.id, {
    ...bookmark.value,
    alias_title: editingTitle.value
  })

  isEditingTitle.value = false
}

const starBookmark = async (isStar: boolean) => {
  trackListItemInteract('star')

  const status = !isStar ? 'unstar' : 'star'
  try {
    await request().post<{ bookmark_id: number; status: string }>({
      url: RESTMethodPath.BOOKMARK_STAR,
      body: {
        bookmark_id: bookmark.value.id,
        status
      }
    })

    emits('bookmarkUpdate', bookmark.value.id, {
      ...bookmark.value,
      starred: status
    })

    analyticsLog({
      event: 'bookmark_star',
      is_starred: isStar,
      source: 'inbox'
    })

    Toast.showToast({
      text: t(!isStar ? 'common.tips.unstar_success' : 'common.tips.star_success'),
      type: ToastType.Success
    })
  } catch (e) {
    console.log(e)
    Toast.showToast({
      text: t('common.tips.operate_failed'),
      type: ToastType.Error
    })
  }
}
</script>
<style lang="scss" scoped>
.bookmark-cell {
  --style: flex justify-between py-0 max-h-200px transition-all duration-500 overflow-hidden;

  &.deleting {
    --style: max-h-0 opacity-0;
  }

  .index {
    --style: mt-1 w-54px h-22px text-(13px #a8b1cd) line-height-22px text-align-center flex-shrink-0 select-none;
  }

  .main-content {
    --style: relative px-0 py-1 select-none overflow-hidden text-ellipsis whitespace-nowrap flex-1;

    .cell-content {
      .seperator {
        --style: w-1px h-10px bg-#99999952;
      }

      .cell-header {
        --style: flex items-center overflow-hidden text-ellipsis overflow-hidden whitespace-nowrap flex-nowrap text-#0f1419;
        .title {
          --style: relative text-(14px #0f1419 ellipsis) line-height-22px overflow-hidden;

          &.stroking {
            &:before {
              --style: content-empty absolute top-1/2 left-0 w-full h-1px bg-#0f1419 animate-fade-in-left animate-ease-in-out animate-duration-500;
            }
          }
        }

        input {
          --style: border-(1px solid #a8b1cd) text-(14px #0f1419) line-height-20px px-4px w-auto min-w-160px max-w-500px;

          &::placeholder,
          &::-webkit-input-placeholder {
            --style: text-(12px #999999);
          }
        }

        .star {
          --style: shrink-0 -m-1px w-16px h-16px mx-8px;

          &.enabled {
            background-image: url('@images/tiny-star-enable.png');
            // --style: bg-[url('@images/tiny-star-enable.png')];
          }
        }

        .seperator {
          --style: mx-8px;
        }

        .retry {
          --style: text-(12px #5490c2) line-height-17px;
        }
      }

      .cell-footer {
        --style: flex items-center mt-2px line-height-17px;

        & > * {
          --style: text-(12px #999999);
        }

        .seperator {
          --style: mx-8px;
        }

        .snapshot {
          --style: 'mr-20px';
        }

        .edit {
          --style: 'text-(12px #999999) hover:(text-#333333)';
        }

        .archieve {
          &.hover {
            --style: text-#333;
          }
        }

        .href {
          --style: flex-center overflow-hidden flex-shrink-1;
          img {
            --style: w-10px h-10px -mb-1px;
          }

          span {
            --style: ml-4px flex-shrink-1 overflow-hidden text-ellipsis;
          }
        }

        .delete {
          --style: 'flex-shrink-0';

          &.hover {
            --style: text-#FF6838;
          }
        }

        .revert {
          --style: ml-20px text-(12px #999999);

          &.hover {
            --style: text-#333;
          }
        }
      }

      button {
        --style: 'p-0 transition-all duration-250 active:(scale-102)';
      }
    }
  }
}
</style>
