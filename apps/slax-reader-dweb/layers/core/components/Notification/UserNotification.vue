<template>
  <div class="user-notification" ref="userNotification">
    <div class="notification-icon" ref="notificationIcon" :class="{ tiny: iconStyle === UserNotificationIconStyle.TINY }" @click="iconClick">
      <img src="@images/tiny-notification-outline-icon.png" alt="" />
    </div>
    <Transition name="opacity">
      <i class="dot" v-show="unreadCount > 0"></i>
    </Transition>
    <Transition name="opacity">
      <div class="notification-bubble" ref="bubble" v-show="showMessageBubble" v-on-click-outside="clickOutSide">
        <div class="notification-header">
          <span>{{ $t('component.user_notification.title') }}</span>
          <div class="flex items-center">
            <button class="check-all" @click="checkAll">{{ $t('common.operate.view_source_all') }}</button>
            <button class="close" @click="showMessageBubble = false">
              <img src="@images/button-dialog-close.png" />
            </button>
          </div>
        </div>
        <Transition name="loading">
          <div class="loading" v-show="loading">
            <div class="i-svg-spinners:90-ring text-24px color-#16b998"></div>
          </div>
        </Transition>
        <div class="empty" v-if="notifications.length === 0">
          <img src="@images/logo-bg-gray.png" alt="" />
          <span>{{ $t('component.user_notification.no_message') }}</span>
        </div>
        <div class="notification-messages" v-else>
          <NotificationCell v-for="notification in notifications" :key="notification.id" :notification="notification" :style="NotificationCellStyle.SIMPLE" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts">
export enum UserNotificationIconStyle {
  NORMAL = 0,
  TINY = 1
}
</script>

<script lang="ts" setup>
import NotificationCell, { NotificationCellStyle } from './NotificationCell.vue'

import { isSafari } from '@commons/utils/is'

import { RESTMethodPath } from '@commons/types/const'
import type { UserNotificationMessageItem } from '@commons/types/interface'
import { vOnClickOutside } from '@vueuse/components'

defineProps({
  bubbleXOffset: {
    type: Number,
    default: 0,
    required: false
  },
  iconStyle: {
    type: Number,
    default: UserNotificationIconStyle.NORMAL,
    required: false
  }
})

const emits = defineEmits(['checkAll'])

const notification = useNotification()
const unreadCount = ref(0)
const showMessageBubble = ref(false)
const notifications = ref<UserNotificationMessageItem[]>([])
const loading = ref(false)
const userNotification = ref<HTMLDivElement>()
const notificationIcon = ref<HTMLDivElement>()
const bubble = ref<HTMLDivElement>()

const defaultValue = {
  bubbleWidth: 480,
  leftOffset: -309
}

const bubbleWidth = ref(`${defaultValue.bubbleWidth}px`)
const leftOffset = ref(`${defaultValue.leftOffset}`)
const isRequestedPermission = ref(false)

watch(
  () => showMessageBubble.value,
  value => {
    if (value) {
      checkAndQueryNotifications()

      resizeUpdate()
    }
  }
)

onMounted(() => {
  addListener()
})

onUnmounted(() => {
  removeListener()
})

const resizeUpdate = () => {
  if (!showMessageBubble.value) {
    return
  }

  const eleRect = document.body.getBoundingClientRect()
  const rect = userNotification.value?.getBoundingClientRect()

  if (bubble.value && eleRect && rect) {
    const width = Math.min(defaultValue.bubbleWidth, eleRect.width)
    const defaultX = rect.left - Math.abs(defaultValue.leftOffset)
    const maxX = defaultX + width

    if (maxX > eleRect.width + eleRect.left) {
      const gap = maxX - eleRect.width - eleRect.left
      const xOffset = Math.max(defaultX - gap, 0)
      leftOffset.value = `-${rect.left - xOffset}px`
    } else if (defaultX < eleRect.left) {
      const gap = eleRect.left - defaultX
      const xOffset = Math.max(defaultX - gap, 0)
      leftOffset.value = `-${rect.left - xOffset}px`
    } else {
      leftOffset.value = `${defaultValue.leftOffset}px`
    }

    bubbleWidth.value = `${width}px`
  }
}

const debounceResize = useDebounceFn(resizeUpdate, 100, { maxWait: 5000 })

const iconClick = () => {
  showMessageBubble.value = !showMessageBubble.value

  if (showMessageBubble.value && isSafari() && !isRequestedPermission.value) {
    isRequestedPermission.value = true
    notification.requestPushPermission()
  }
}

const clickOutSide = (event?: PointerEvent) => {
  if (event?.target) {
    const target = event.target as HTMLElement
    if (notificationIcon.value?.contains(target)) {
      return
    }
  }

  if (!showMessageBubble.value) {
    return
  }

  showMessageBubble.value = false
}

const checkAll = async () => {
  emits('checkAll')

  unreadCount.value = 0
  showMessageBubble.value = false
}

const addListener = () => {
  window.addEventListener('resize', debounceResize)
}

const removeListener = () => {
  window.removeEventListener('resize', debounceResize)
}

const checkAndQueryNotifications = async () => {
  if (!showMessageBubble.value || (!unreadCount.value && notifications.value.length)) {
    return
  }

  loading.value = true

  try {
    const res = await request.get<UserNotificationMessageItem[]>({
      url: RESTMethodPath.NOTIFICATION_LIST,
      query: {
        page: 1,
        page_size: 10
      }
    })

    if (res) {
      notifications.value = res || []
    }
  } finally {
    loading.value = false
  }
}

if (notification.isSupportedNotification) {
  notification.registerWorker().then(res => {
    notification.onMessage(event => {
      console.log('event', event)
      if (typeof event?.data === 'string') {
        const data = JSON.parse(event?.data)
        unreadCount.value = data?.unreadCount || 0
      }
    })

    notification.sendMessage({
      type: 'ready'
    })
  })
} else {
  request
    .get<{ unread_count: number }>({
      url: RESTMethodPath.GET_UNREAD_COUNT
    })
    .then(res => {
      unreadCount.value = res?.unread_count || 0
    })
}
</script>

<style lang="scss" scoped>
.user-notification {
  --style: relative;
  .notification-icon {
    --style: flex w-24px h-24px cursor-pointer;
    img {
      --style: object-fit;
    }

    &.tiny {
      --style: w-16px h-16px;
    }
  }

  .dot {
    --style: absolute top-0 right-0 w-5px h-5px rounded-full bg-#f6af69;
  }

  .notification-bubble {
    --style: 'absolute top-full rounded-16px mt-10px z-10 bg-#fff border-(1px solid #ecf0f5) shadow-[0px_30px_60px_0px_#0000000a] transition-all duration-250';

    width: v-bind(bubbleWidth);
    left: v-bind(leftOffset);

    .notification-header {
      --style: px-24px h-56px border-b-(1px solid #ecf0f5) flex justify-between items-center;

      span {
        --style: text-(14px #333) font-600 line-height-20px;
      }

      .check-all {
        --style: 'text-(14px #5490c2) line-height-20px hover:(scale-102) active:(scale-105) transition-all duration-250';
      }

      .close {
        --style: 'md:(hidden) ml-10px -mr-16px w-32px h-32px flex-center hover:(scale-103 opacity-90) active:(scale-105) transition-all duration-250';

        img {
          --style: w-16px h-auto;
        }
      }
    }

    .loading {
      --style: overflow-hidden h-50px flex-center max-h-50px;
    }

    .empty {
      --style: flex-center flex-col h-413px;

      img {
        --style: w-60px object-contain;
      }

      span {
        --style: mt-24px text-(14px #999) line-height-22px;
      }
    }

    .notification-messages {
      --style: 'py-8px max-md:(px-5px) md:(px-10px) max-h-413px overflow-auto relative';
      scrollbar-width: none;
      &::-webkit-scrollbar {
        --style: hidden;
      }
    }
  }
}

.loading-enter-active,
.loading-leave-active {
  transition: all 0.4s;
}

.loading-enter-from,
.loading-leave-to {
  --style: '!max-h-0 opacity-0';
}
</style>
