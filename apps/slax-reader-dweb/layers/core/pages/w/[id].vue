<template>
  <div class="raw-web">
    <div class="header">
      <div class="left">
        <div class="items-wrapper">
          <img src="@images/logo-sm.png" alt="" />
          <span class="title" @click="navigateToBookmarks">{{ $t('common.app.name') }}</span>
          <ClientOnly><ProIcon /></ClientOnly>
        </div>
      </div>
      <div class="right">
        <ClientOnly>
          <UserNotification v-if="user" :iconStyle="UserNotificationIconStyle.TINY" @checkAll="navigateToNotification" />
          <OperatesBar />
        </ClientOnly>
      </div>
    </div>
    <div class="content-wrapper">
      <div class="iframe-wrapper">
        <iframe
          id="content"
          ref="iframeRef"
          sandbox="allow-downloads allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-scripts allow-same-origin allow-forms"
          class="iframe-content"
        ></iframe>
        <div class="iframe-mask" v-if="isDragging" @click.stop></div>
        <div class="iframe-mask" v-if="isLoading"><div class="i-svg-spinners:90-ring text-50px color-slate"></div></div>
      </div>
      <RawWebPanel
        v-if="bookmarkBriefInfo"
        ref="rawWebPanel"
        v-model:show="isPanelShowing"
        :enable-share="true"
        @is-dragging="val => (isDragging = val)"
        @selectedTypeUpdate="selectedTypeUpdate"
      >
        <template #sidebar>
          <Transition name="opacity">
            <div v-show="summariesExpanded" class="dark px-20px py-4px">
              <AISummaries :bookmark-id="Number(id)" :is-appeared="summariesExpanded" :close-button-hidden="true" :content-selector="'body'" @navigated-text="() => false" />
            </div>
          </Transition>
          <template v-if="!isSubscriptionExpired">
            <Transition name="opacity">
              <div v-show="botExpanded" class="dark size-full">
                <ChatBot ref="chatbot" :bookmark-id="Number(id)" :is-appeared="botExpanded" :close-button-hidden="true" />
              </div>
            </Transition>
          </template>
        </template>
      </RawWebPanel>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ShareModalType } from '../../components/Modal/ShareModal.vue'
import AISummaries from '#layers/core/components/AISummaries.vue'
import ChatBot from '#layers/core/components/Chat/ChatBot.vue'
import OperatesBar from '#layers/core/components/global/OperatesBar.vue'
import UserNotification, { UserNotificationIconStyle } from '#layers/core/components/Notification/UserNotification.vue'
import RawWebPanel, { PanelItemType } from '#layers/core/components/RawWebPanel.vue'

import { RequestMethodType } from '@commons/utils/request'

import { useWebBookmark, useWebBookmarkDetail } from '../../composables/bookmark/useWebBookmark'
import { RESTMethodPath } from '@commons/types/const'
import type { BookmarkBriefDetail } from '@commons/types/interface'
import { ArticleSelection } from '#layers/core/components/Article/Selection/selection'
import type { QuoteData } from '#layers/core/components/Chat/type'
import { showShareConfigModal } from '#layers/core/components/Modal'
import markCss from '#layers/core/styles/mark.css?raw'

const route = useRoute()

const id = String(route.params.id)
const iframeRef = ref<HTMLIFrameElement | null>(null)
const iframeDocument = ref<Document | null>(null)
const iframeWindow = ref<Window | null>(null)
const bookmarkBriefInfo = ref<BookmarkBriefDetail | null>(null)
const articleSelection = ref<ArticleSelection | null>(null)
const rawWebPanel = ref<InstanceType<typeof RawWebPanel>>()
const chatbot = ref<InstanceType<typeof ChatBot>>()

const isLoading = ref(false)
const isDragging = ref(false)

const { title, allowAction, bookmarkUserId } = useWebBookmarkDetail(bookmarkBriefInfo)

const { injectCssToIframe } = useIframeStyles(iframeRef, markCss)

const highlightMarks = async () => {
  if (!iframeDocument.value!.body) return

  articleSelection.value = new ArticleSelection({
    bookmarkId: Number(id),
    allowAction: allowAction.value,
    ownerUserId: bookmarkUserId.value,
    containerDom: iframeDocument.value!.body as HTMLDivElement,
    monitorDom: iframeDocument.value!.body as HTMLDivElement,
    iframe: iframeRef.value!,
    postQuoteDataHandler: (data: QuoteData) => {
      chatBotQuote(data)
    }
  })

  if (bookmarkBriefInfo.value?.marks) {
    articleSelection.value.drawMark(bookmarkBriefInfo.value?.marks)
  }

  articleSelection.value.startMonitor()
}

const loadInlineBookmarkDetail = async () => {
  if (isLoading.value) return

  isLoading.value = true
  try {
    const res = await request.get<BookmarkBriefDetail>({
      url: RESTMethodPath.BOOKMARK_BRIEF,
      method: RequestMethodType.get,
      query: {
        bookmark_id: id
      }
    })
    if (!res) throw new Error('loadInlineBookmarkDetail failed')
    bookmarkBriefInfo.value = res
  } finally {
    isLoading.value = false
  }
}

const injectInlineScript = async () => {
  document.title = `Slax Reader - ${bookmarkBriefInfo.value?.title}`
  iframeRef.value!.src = `/w/liveproxy/mp_/${bookmarkBriefInfo.value!.target_url}`

  await new Promise<void>(resolve => {
    const loadHandler = () => {
      iframeRef.value?.removeEventListener('load', loadHandler)
      resolve()
    }
    iframeRef.value?.addEventListener('load', loadHandler)
  })

  if (!iframeRef.value) throw new Error('iframeRef is not supported')

  iframeDocument.value = iframeRef.value.contentDocument
  iframeWindow.value = iframeRef.value.contentWindow

  if (!iframeDocument.value || !iframeWindow.value) throw new Error('cannot access iframe content')

  if (iframeDocument.value.readyState !== 'complete') {
    await new Promise<void>(resolve => {
      iframeDocument.value!.addEventListener('DOMContentLoaded', () => {
        resolve()
      })
    })
  }

  new MutationObserver(function (mutations) {
    window.document.title = 'Slax Reader - ' + mutations[0].target.textContent || ''
  }).observe(iframeDocument.value?.querySelector('title')!, { subtree: true, characterData: true, childList: true })

  injectCssToIframe()
}

const initInlineScript = async () => {
  if (!navigator.serviceWorker) throw new Error('navigator.serviceWorker is not supported')

  await navigator.serviceWorker.register('/liveproxy-sw.js', { scope: '/w' })

  if (!navigator.serviceWorker.controller) {
    await new Promise<void>(resolve => {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        resolve()
      })
    })
  }

  navigator.serviceWorker.controller!.postMessage({
    msg_type: 'init',
    proxy_prefix: '/w/liveproxy',
    proxy_prefix_regexp: '(?:\/proxy\/(?:([0-9]*)([a-z]{2,3})_)?\/|\/w\/liveproxy\/(?:([a-z]{2,3})_)?\/)(https?:\/\/.+)'
  })

  await new Promise<void>(resolve => {
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data.msg_type === 'init_done') {
        resolve()
      }
    })
  })
}

const selectedTypeUpdate = (type: PanelItemType, handler?: (valid: boolean) => void) => {
  let valid = true

  if (type === PanelItemType.Feedback) {
    showFeedback()
  } else if (type === PanelItemType.Share) {
    showShareConfigModal({
      bookmarkId: Number(id),
      title: window.document.title,
      type: ShareModalType.Original
    })
  } else if (type === PanelItemType.Chat) {
    valid = showChatbot()
  } else if (type === PanelItemType.AI) {
    valid = showAnalyzed()
  }

  handler && handler(valid)
}

const initInline = async () => {
  await initInlineScript()
  await loadInlineBookmarkDetail()
  await injectInlineScript()
  await highlightMarks()
}

const {
  user,
  isSubscriptionExpired,
  isPanelShowing,
  summariesExpanded,
  botExpanded,
  showAnalyzed,
  showChatbot,
  chatBotQuote,
  showFeedback,
  navigateToNotification,
  navigateToBookmarks
} = useWebBookmark({
  chatbot,
  typeOptions: () => {
    return {
      type: BookmarkType.Normal,
      title: title.value,
      bmId: Number(id)
    }
  },
  initialRequestTask: async () => {
    await initInline()
  }
})
</script>

<style lang="scss" scoped>
.raw-web {
  --style: relative w-full h-100vh flex flex-col;

  .header {
    --style: 'absolute top-0 left-0 w-full h-[var(--header-height)] z-10 p-0 flex items-center shrink-0 justify-between select-none bg-#f5f5f3';

    .left {
      --style: ml-40px h-full flex items-center relative;

      .items-wrapper {
        --style: absolute top-0 left-0 h-full flex items-center select-none;

        & > * {
          --style: 'not-first:ml-8px shrink-0';
        }

        img {
          --style: w-20px;
        }

        .title {
          --style: font-semibold text-(#16b998 15px) line-height-21px cursor-pointer;
        }
      }
    }

    .right {
      --style: mr-40px h-full flex items-center relative;
      & > * {
        --style: 'not-first:ml-16px';
      }
    }
  }

  .content-wrapper {
    --style: 'relative w-full h-full pt-[var(--header-height)] flex justify-between items-center';
    .iframe-wrapper {
      --style: size-full border-none;

      .iframe-content {
        --style: size-full border-none;
      }
    }

    .iframe-mask {
      --style: absolute inset-0 flex items-center justify-center;
    }
  }
}
</style>

<!-- eslint-disable-next-line vue-scoped-css/enforce-style-type -->
<style lang="scss">
html {
  background-color: #f5f5f3;
}
</style>
