<template>
  <!-- 卡片式书签条目：hover 浮起阴影，操作区 hover 显示 -->
  <div class="article-card" :class="{ deleting: isDeleting }">
    <!-- 序号 -->
    <span class="article-num">{{ index !== undefined ? index + 1 : '' }}</span>

    <div class="article-body">
      <!-- 标题区：正常态为 button，编辑态为 input -->
      <div class="title-wrap">
        <button v-if="!isEditingTitle" class="article-title" :class="{ stroking: isStroking }" @click="clickTitle">
          {{ bookmark.alias_title || bookmark.title || bookmark.target_url }}
        </button>
        <input
          ref="input"
          type="text"
          v-else
          class="article-title-input"
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
      </div>

      <!-- meta 行：日期 + 来源 + hover 操作区 -->
      <div class="article-meta">
        <span class="article-date">{{ dateString }}</span>
        <span class="article-source" @click.stop="clickHref">{{ getSiteName() }}</span>

        <!-- hover 操作区 -->
        <div class="article-actions">
          <!-- 编辑标题 -->
          <button class="article-action" ref="editTitleButton" @click="clickEdit" type="button">
            {{ !isEditingTitle ? $t('common.operate.edit_title') : $t('common.operate.cancel_edit_title') }}
          </button>

          <!-- 归档 / 取消归档（非废纸篓 + 非订阅） -->
          <template v-if="!isTrashed && !isSubscribe">
            <button
              v-if="['inbox', 'archive'].indexOf(bookmark.archived) !== -1 && !isArchiving"
              class="article-action"
              ref="archieveButton"
              @click="archiveBookmark(bookmark.archived === 'inbox')"
              type="button"
            >
              {{ bookmark.archived === 'inbox' ? $t('common.operate.archive') : $t('common.operate.unarchive') }}
            </button>
            <div class="i-svg-spinners:90-ring text-accent w-12px" v-else-if="isArchiving"></div>
          </template>

          <!-- 删除（非废纸篓 + 非订阅） -->
          <button v-if="!isTrashed && !isSubscribe" class="article-action danger" @click="clickDelete" type="button">
            {{ $t('common.operate.trashed') }}
          </button>

          <!-- 恢复（废纸篓） -->
          <button v-if="isTrashed" class="article-action" ref="revertButton" @click="clickRevert" type="button">
            {{ $t('common.operate.revert_to_inbox') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 星标按钮：绝对定位右侧（非废纸篓 + 非订阅） -->
    <button v-if="!isTrashed && !isSubscribe" class="article-star" :class="{ active: isStarred }" @click="starBookmark(!isStarred)" type="button">
      <!-- 未星标：outline 星 -->
      <svg class="star-outline" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <!-- 已星标：填充星 -->
      <svg class="star-filled" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { urlHttpString } from '@commons/utils/string'

import { RESTMethodPath } from '@commons/types/const'
import { type BookmarkItem, BookmarkParseStatus, type EmptyBookmarkResp } from '@commons/types/interface'
import { vOnClickOutside, vOnKeyStroke } from '@vueuse/components'
import { formatDate } from '@vueuse/core'
import { showSnapshotStatusModal } from '#layers/core/app/components/Modal'
import Toast, { ToastType } from '#layers/core/app/components/Toast'

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

  // 优先跳快照页
  clickCache()
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

  // 跳转公开页 /b/[id]，用 bookmark_user_uuid 作路由标识
  const uuid = bookmark.value.bookmark_user_uuid
  if (!uuid) {
    // 缺标识时降级打开原文，避免跳到 /b/undefined
    clickHref()
    return
  }

  pwaOpen({
    url: '/b/' + uuid
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
      if (input.value) {
        input.value.focus()
        const end = input.value.value.length
        input.value.setSelectionRange(end, end)
      }
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
// 卡片容器：hover 浮起阴影 + 上移 1px
.article-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 18px 20px;
  background: var(--slax-surface);
  border: 1px solid var(--slax-border);
  border-radius: var(--slax-radius);
  box-shadow: inset 0 1px 0 var(--slax-inset-hi, rgba(255, 255, 255, 0.06));
  transition: all 0.2s;
  max-height: 200px;

  &:hover {
    box-shadow:
      var(--slax-shadow-warm),
      inset 0 1px 0 var(--slax-inset-hi, rgba(255, 255, 255, 0.06));
    transform: translateY(-1px);
  }

  // 删除动画
  &.deleting {
    max-height: 0;
    opacity: 0;
    padding-top: 0;
    padding-bottom: 0;
    border-width: 0;
    transition: all 0.5s;
  }
}

// 序号：衬线字体，右对齐，固定宽度
.article-num {
  font-family: var(--slax-font-serif);
  font-size: 12px;
  color: var(--slax-text-light);
  min-width: 24px;
  padding-top: 2px;
  text-align: right;
  flex-shrink: 0;
  line-height: 1.6;
  user-select: none;
}

// 内容区：flex-1，右侧留出星标空间
.article-body {
  flex: 1;
  min-width: 0;
  padding-right: 28px;
}

// 标题外层容器：控制截断，让 button 宽度由文字决定
.title-wrap {
  display: block;
  width: 100%;
  overflow: hidden;
  margin-bottom: 8px;
}

// 标题按钮
.article-title {
  display: inline-block;
  max-width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  padding: 0;
  font-family: var(--slax-font-serif);
  font-size: 15px;
  color: var(--slax-text);
  line-height: 1.45;
  letter-spacing: -0.01em;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
  transition: color 0.12s;
  position: relative;

  &:hover {
    color: var(--slax-accent);
  }

  // 划线删除动画：clip-path 从左到右展开，宽度跟随文字
  &.stroking {
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      width: 100%;
      height: 1.5px;
      background: var(--slax-text);
      transform: translateY(-50%);
      animation: strikethrough 0.5s ease-in-out forwards;
    }
  }
}

// 标题编辑输入框
.article-title-input {
  display: block;
  width: 100%;
  font-family: var(--slax-font-serif);
  font-size: 15px;
  color: var(--slax-text);
  line-height: 1.45;
  margin-bottom: 8px;
  // #a8b1cd 浅蓝灰为输入边框辅助色，保留
  border: 1px solid #a8b1cd;
  border-radius: 4px;
  padding: 2px 6px;
  background: transparent;
  outline: none;

  &::placeholder {
    color: var(--slax-text-light);
  }
}

// meta 行：日期 + 来源 + 操作区
.article-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: nowrap;
  overflow: visible;
}

// 日期
.article-date {
  font-size: 11px;
  color: var(--slax-text-light);
  font-weight: 300;
  flex-shrink: 0;
  white-space: nowrap;
}

// 来源标签：胶囊形，点击跳转原链接
.article-source {
  font-size: 11px;
  color: var(--slax-text-muted);
  background: var(--slax-accent-bg);
  padding: 2px 10px;
  border-radius: 999px;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 1;
  transition: all 0.12s;

  &:hover {
    color: var(--slax-accent);
  }
}

// hover 操作区：默认隐藏，卡片 hover 时显示
.article-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.15s;
  flex-shrink: 0;

  .article-card:hover & {
    opacity: 1;
  }
}

// 操作按钮
.article-action {
  padding: 4px 10px;
  font-size: 11px;
  color: var(--slax-text-light);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.12s;
  font-family: inherit;
  white-space: nowrap;

  &:hover {
    background: var(--slax-accent-bg);
    color: var(--slax-text);
  }

  &.danger:hover {
    color: var(--slax-danger);
    background: var(--slax-danger-bg);
  }
}

// 星标按钮：绝对定位右侧
.article-star {
  position: absolute;
  right: 0;
  top: 16px;
  height: 28px;
  width: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--slax-text-light);
  opacity: 0.3;
  transition: all 0.15s;
  background: none;
  border: none;
  border-radius: 0 var(--slax-radius) 0 var(--slax-radius);

  &:hover {
    opacity: 0.6;
  }

  &.active {
    color: var(--slax-accent);
    opacity: 0.7;
  }

  // 未激活时隐藏填充星，显示 outline 星
  .star-filled {
    display: none;
  }

  &.active {
    .star-filled {
      display: block;
    }

    .star-outline {
      display: none;
    }
  }
}

@keyframes strikethrough {
  from {
    clip-path: inset(0 100% 0 0);
  }
  to {
    clip-path: inset(0 0% 0 0);
  }
}
</style>
