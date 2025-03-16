import { ref } from 'vue'

import { isClient } from '@commons/utils/is'

import { useSubscribe } from '../isolation/useSubscribe'
import { BookmarkType, type BookmarkTypeOptions, type CommonBookmarkOptions } from './type'
import { useResize } from './useCommon'
import type { UserInfo } from '@commons/types/interface'
import type ChatBot from '#layers/base/components/Chat/ChatBot.vue'
import type { QuoteData } from '#layers/base/components/Chat/type'
import { showFeedbackModal, showLoginModal } from '#layers/base/components/Modal'
import { useUserStore } from '#layers/base/stores/user'
interface BookmarkOptions extends CommonBookmarkOptions {
  chatbot: Ref<InstanceType<typeof ChatBot> | undefined>
  typeOptions: () => BookmarkTypeOptions
  initialRequestTask?: () => Promise<void>
  initialTasksCompleted?: () => void
}

export const useBookmark = (options: BookmarkOptions) => {
  const y = (() => {
    return isClient ? useScroll(window, { behavior: 'smooth', throttle: 10 }).y : ref(0)
  })()

  const userStore = useUserStore()
  const user = ref<UserInfo | null>(userStore.userInfo)
  const redirectHref = useRequestURL().href
  const { isSubscriptionExpired, checkSubscriptionExpired, updateSubscribeStatus } = useSubscribe()

  const { detailLayout, summariesSidebar, botSidebar, bookmarkDetail, chatbot, typeOptions } = options
  const { resizeAnimated, summariesExpanded, botExpanded, onResizeObserver, contentXOffset, isLocked, isNeedResized } = useResize({
    detailLayout,
    summariesSidebar,
    botSidebar,
    bookmarkDetail
  })

  const feedbackType = ref('parse_error')
  const showFeedback = () => {
    const options = typeOptions()

    if (options.type === BookmarkType.Normal) {
      showFeedbackModal({
        reportType: feedbackType.value,
        title: options.title,
        bookmarkId: options.bmId
      })
    } else if (options.type === BookmarkType.Share) {
      showFeedbackModal({
        reportType: feedbackType.value,
        title: options.title,
        shareCode: options.shareCode
      })
    }
  }

  const showAnalyzed = () => {
    if (!loginVerify()) {
      return
    }

    botExpanded.value = false
    summariesExpanded.value = !summariesExpanded.value

    const options = typeOptions()
    if (summariesExpanded.value) {
      if (options.type === BookmarkType.Normal) {
        const { bmId } = options
        analyticsLog({
          event: 'click_ai_summary',
          value: {
            //TODO: user_id要用store统一在提供的api接口中设置
            user: userStore.user?.userId || 0,
            bookmark_id: bmId
          }
        })
      } else if (options.type === BookmarkType.Share) {
        const { shareCode } = options
        analyticsLog({
          event: 'click_ai_summary',
          value: {
            user: userStore.user?.userId || 0,
            share_code: shareCode
          }
        })
      }
    }
  }

  const showChatbot = () => {
    if (!loginVerify() || checkSubscriptionExpired()) {
      return
    }

    summariesExpanded.value = false
    botExpanded.value = !botExpanded.value

    const options = typeOptions()
    if (botExpanded.value) {
      if (options.type === BookmarkType.Normal) {
        const { bmId, title } = options
        analyticsLog({
          event: 'click_ai_chat',
          value: {
            user: userStore.user?.userId || 0,
            bookmark_id: bmId,
            source: 'bookmark',
            title: title
          }
        })
      } else if (options.type === BookmarkType.Share) {
        const { shareCode, title } = options
        analyticsLog({
          event: 'click_ai_chat',
          value: {
            user: userStore.user?.userId || 0,
            share_code: shareCode,
            source: 'bookmark',
            title: title
          }
        })
      }
    }
  }

  const chatBotQuote = (data: QuoteData) => {
    if (!loginVerify() || checkSubscriptionExpired()) {
      return
    }

    const handleQuote = () => {
      if (!botExpanded.value) {
        botExpanded.value = true
      }
      // 如果没打开chatbot侧边栏，不生成问题，直接push到对话框
      // 如果已经打开了且在对话中，push到对话框但是不能发送
      // 如果已经打开了且没在对话中，push到对话框
      chatbot.value?.addQuoteData(data)
    }

    nextTick(() => handleQuote())
  }

  const navigateToBookmarks = () => {
    navigateTo('/bookmarks', {
      replace: true
    })
  }

  const navigateToText = () => {
    if (detailLayout.value?.isSmallScreen()) {
      summariesExpanded.value = false
    }
  }

  const navigateToNotification = () => {
    navigateTo('/bookmarks?filter=notifications', {})
  }

  const screenLockUpdate = (lock: boolean) => {
    isLocked.value = lock
  }

  const backToTop = () => {
    y.value = 0
  }

  const loginVerify = () => {
    if (user.value) {
      return true
    }

    showLoginModal({
      redirect: redirectHref
    })

    return false
  }

  const tasks: Promise<void>[] = []
  if (isClient) {
    tasks.push(
      (async () => {
        if (!userStore.isLogin) {
          return
        }

        const res = await userStore.getUserInfo()
        if (!res) return

        user.value = res
        const refreshedUserInfo = await userStore.getUserInfo({ refresh: true })
        updateSubscribeStatus(refreshedUserInfo)
      })()
    )
  }

  if (options.initialRequestTask) {
    tasks.push(options.initialRequestTask())
  }

  Promise.allSettled(tasks).then(() => {
    setTimeout(() => {
      options?.initialTasksCompleted && options.initialTasksCompleted()
    }, 0)
  })

  console.log(redirectHref)
  return {
    user,
    isSubscriptionExpired,
    redirectHref,
    resizeAnimated,
    summariesExpanded,
    botExpanded,
    contentXOffset,
    isNeedResized,
    onResizeObserver,
    showAnalyzed,
    showChatbot,
    chatBotQuote,
    showFeedback,
    backToTop,
    loginVerify,
    screenLockUpdate,
    navigateToNotification,
    navigateToBookmarks,
    navigateToText
  }
}
