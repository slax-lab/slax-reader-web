import { ref } from 'vue'
import { computed } from 'vue'

import { isClient } from '@commons/utils/is'

import type { UserInfo } from '@commons/types/interface'
import type ChatBot from '#layers/core/components/Chat/ChatBot.vue'
import type { QuoteData } from '#layers/core/components/Chat/type'
import { showLoginModal } from '#layers/core/components/Modal'
import { useUserStore } from '#layers/core/stores/user'

interface WebBookmarkOptions {
  chatbot: Ref<InstanceType<typeof ChatBot> | undefined>
  typeOptions: () => BookmarkTypeOptions
  initialRequestTask?: () => Promise<void>
  initialTasksCompleted?: () => void
}

export enum PanelItemType {
  'AI' = 'ai',
  'Chat' = 'chat',
  'Share' = 'share',
  'Comment' = 'comment',
  'Feedback' = 'feedback'
}

export const useWebBookmark = (options: WebBookmarkOptions) => {
  const userStore = useUserStore()
  const user = ref<UserInfo | null>(userStore.userInfo)
  const panelType = ref<PanelItemType | ''>('')
  const isPanelShowing = ref(false) // 记录侧边栏是否展开
  const summariesExpanded = ref(false) // 标记摘要是否展开
  const botExpanded = ref(false) // 标记chatbot是否展开
  const redirectHref = useRequestURL().href
  const { isSubscriptionExpired, checkSubscriptionExpired, updateSubscribeStatus } = useUserSubscribe()

  const { chatbot, typeOptions } = options

  const feedbackType = ref('parse_error')
  const showFeedback = () => {
    const options = typeOptions()

    showFeedbackView(options, feedbackType.value)
  }

  watch(
    () => summariesExpanded.value,
    val => {
      if (val && !isPanelShowing.value) {
        isPanelShowing.value = true
      }
    }
  )

  watch(
    () => botExpanded.value,
    val => {
      if (val && !isPanelShowing.value) {
        isPanelShowing.value = true
      }
    }
  )

  watch(
    () => panelType.value,
    val => {
      summariesExpanded.value = val === PanelItemType.AI
      botExpanded.value = val === PanelItemType.Chat
    }
  )

  const showAnalyzed = () => {
    if (!loginVerify()) {
      return
    }

    panelType.value = PanelItemType.AI

    const options = typeOptions()
    if (summariesExpanded.value) {
      logAnalyzed(options, userStore.user?.userId || 0)
    }

    return true
  }

  const showChatbot = () => {
    if (!loginVerify() || checkSubscriptionExpired()) {
      return
    }

    panelType.value = PanelItemType.Chat

    const options = typeOptions()
    if (botExpanded.value) {
      logChat(options, userStore.user?.userId || 0)
    }

    return true
  }

  const chatBotQuote = (data: QuoteData) => {
    if (!botExpanded.value) {
      const res = showChatbot()
      if (!res) {
        return
      }
    } else if (botExpanded.value && !isPanelShowing.value) {
      isPanelShowing.value = true
    }

    const handleQuote = () => {
      chatbot.value?.addQuoteData(data)
    }

    nextTick(() => handleQuote())
  }

  const navigateToBookmarks = () => {
    navigateTo('/bookmarks', {
      replace: true
    })
  }

  const navigateToNotification = () => {
    navigateTo('/bookmarks?filter=notifications', {})
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

  return {
    user,
    isSubscriptionExpired,
    redirectHref,
    isPanelShowing,
    panelType,
    summariesExpanded,
    botExpanded,
    showAnalyzed,
    showChatbot,
    chatBotQuote,
    showFeedback,
    loginVerify,
    navigateToNotification,
    navigateToBookmarks
  }
}

export const useWebBookmarkDetail = (detail: Ref<WebBookmarkArticleDetail | null>) => {
  const { t } = useI18n()
  const title = computed(() => {
    if (!detail.value) {
      return ''
    }

    return (isBookmarkBrief(detail.value) ? detail.value.title : detail.value.title) || t('component.bookmark_article.no_title')
  })

  const { allowAction, bookmarkUserId } = useWebBookmarkArticleRelative(detail)

  return {
    title,
    allowAction,
    bookmarkUserId
  }
}

export const useStar = () => {}
