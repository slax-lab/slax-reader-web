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
          <UserNotification v-if="user" @checkAll="navigateToNotification" />
          <OperatesBar />
        </ClientOnly>
      </div>
    </div>
    <div class="content-wrapper">
      <template v-if="canView">
        <NuxtLoadingIndicator color="#16b998" />
        <div class="iframe-wrapper">
          <iframe
            id="content"
            ref="iframeRef"
            sandbox="allow-downloads allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-scripts allow-same-origin allow-forms"
            class="iframe-content"
          ></iframe>
          <div class="iframe-mask" v-if="isDragging" @click.stop></div>
        </div>
        <RawWebPanel
          v-if="inlineBookmarkDetail"
          ref="rawWebPanel"
          v-model:show="isPanelShowing"
          :enable-share="false"
          :panel-type="panelType"
          @selectedType="selectedType"
          @is-dragging="val => (isDragging = val)"
        >
          <template #sidebar>
            <Transition name="opacity">
              <div v-show="summariesExpanded" class="dark px-20px py-4px">
                <AISummaries :share-code="id" :is-appeared="summariesExpanded" :close-button-hidden="true" :content-selector="'iframe#content'" @navigated-text="() => false" />
              </div>
            </Transition>
            <template v-if="!isSubscriptionExpired">
              <Transition name="opacity">
                <div v-show="botExpanded" class="dark size-full">
                  <ChatBot ref="chatbot" :share-code="id" :is-appeared="botExpanded" :close-button-hidden="true" @find-quote="findQuote" />
                </div>
              </Transition>
            </template>
          </template>
        </RawWebPanel>
      </template>
      <template v-else>
        <ClientOnly>
          <div class="status">
            <div class="loading" v-if="isLoading">
              <div class="i-svg-spinners:90-ring w-1em"></div>
              <span class="ml-5">{{ $t('page.bookmarks_detail.loading') }}</span>
            </div>
            <div class="refresh" v-else-if="isNeedRefresh">
              <span>{{ $t('common.tips.fetch_error') }}</span>
              <button @click="refreshIframe">{{ $t('common.operate.refetch') }}</button>
            </div>
          </div>
        </ClientOnly>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import AISummaries from '#layers/core/components/AISummaries.vue'
import ChatBot from '#layers/core/components/Chat/ChatBot.vue'
import OperatesBar from '#layers/core/components/global/OperatesBar.vue'
import { ShareModalType } from '#layers/core/components/Modal/ShareModal.vue'
import UserNotification from '#layers/core/components/Notification/UserNotification.vue'
import RawWebPanel from '#layers/core/components/RawWebPanel.vue'

import { RequestMethodType } from '@commons/utils/request'

import { RESTMethodPath } from '@commons/types/const'
import type { InlineBookmarkDetail } from '@commons/types/interface'
import { MarkType } from '@commons/types/interface'
import { PanelItemType, useWebBookmark, useWebBookmarkDetail } from '#layers/core//composables/bookmark/useWebBookmark'
import {
  DwebBookmarkProvider,
  DwebEnvironmentAdapter,
  DwebHttpClient,
  DwebI18nService,
  DwebToastService,
  DwebUserProvider
} from '#layers/core/components/Article/Selection/adapters'
import { DwebArticleSelection } from '#layers/core/components/Article/Selection/DwebArticleSelection'
import { MarkModal } from '#layers/core/components/Article/Selection/modal'
import type { QuoteData } from '#layers/core/components/Chat/type'
import { showShareConfigModal } from '#layers/core/components/Modal'
import markCss from '#layers/core/styles/mark.css?raw'

const route = useRoute()

const id = String(route.params.id)
const iframeRef = ref<HTMLIFrameElement | null>(null)
const iframeDocument = ref<Document | null>(null)
const iframeWindow = ref<Window | null>(null)
const inlineBookmarkDetail = ref<InlineBookmarkDetail | null>(null)
const articleSelection = ref<DwebArticleSelection | null>(null)
const rawWebPanel = ref<InstanceType<typeof RawWebPanel>>()
const chatbot = ref<InstanceType<typeof ChatBot>>()
const isLoading = ref(false)
const isDragging = ref(false)
const isNeedRefresh = ref(false)

const canView = computed(() => {
  return inlineBookmarkDetail.value && !isLoading.value && !isNeedRefresh.value
})

const { title, allowAction, bookmarkUserId } = useWebBookmarkDetail(inlineBookmarkDetail)

const { injectCssToIframe } = useIframeStyles(iframeRef, markCss)

const { progress, start, finish, clear } = useLoadingIndicator({
  duration: 5000,
  throttle: 200,
  estimatedProgress: (duration, elapsed) => (2 / Math.PI) * 100 * Math.atan(((elapsed / duration) * 100) / 50)
})

const highlightMarks = async () => {
  if (!iframeDocument.value!.body) return

  const config = {
    shareCode: id,
    allowAction: allowAction.value,
    ownerUserId: bookmarkUserId.value,
    containerDom: iframeDocument.value!.body as HTMLDivElement,
    monitorDom: iframeDocument.value!.body as HTMLDivElement,
    iframe: iframeRef.value!,
    postQuoteDataHandler: (data: QuoteData) => {
      chatBotQuote(data)
    }
  }

  const dependencies = {
    userProvider: new DwebUserProvider(),
    httpClient: new DwebHttpClient(),
    toastService: new DwebToastService(),
    i18nService: new DwebI18nService(),
    environmentAdapter: new DwebEnvironmentAdapter(),
    bookmarkProvider: new DwebBookmarkProvider({
      bookmarkId: 0,
      shareCode: id,
      collection: undefined,
      ownerUserId: bookmarkUserId.value
    }),
    refFactory: ref,
    getMarkType: (type: 'comment' | 'reply' | 'line') => {
      if (type === 'comment') {
        return !!config.iframe ? MarkType.ORIGIN_COMMENT : MarkType.COMMENT
      } else if (type === 'reply') {
        return MarkType.REPLY
      } else {
        return !!config.iframe ? MarkType.ORIGIN_LINE : MarkType.LINE
      }
    }
  }

  const modal = new MarkModal(config)

  articleSelection.value = new DwebArticleSelection(config, dependencies, modal)

  if (articleSelection.value == null) {
    throw new Error('ArticleSelection initialization failed')
  }

  if (inlineBookmarkDetail.value?.marks) {
    articleSelection.value.drawMark(inlineBookmarkDetail.value?.marks)
  }

  articleSelection.value.startMonitor()
}

const loadInlineBookmarkDetail = async () => {
  if (isLoading.value) return

  isLoading.value = true
  try {
    const res = await request().get<InlineBookmarkDetail>({
      url: RESTMethodPath.INLINE_BOOKMARK_DETAIL,
      method: RequestMethodType.get,
      query: {
        share_code: id
      }
    })
    if (!res) throw new Error('loadInlineBookmarkDetail failed')
    inlineBookmarkDetail.value = res
  } finally {
    isLoading.value = false
  }
}

const findQuote = (quote: QuoteData) => {
  articleSelection.value?.findQuote(quote)
}

const selectedType = (type: PanelItemType) => {
  if (panelType.value === type && [PanelItemType.AI, PanelItemType.Chat].includes(type)) {
    isPanelShowing.value = !isPanelShowing.value
    return
  }

  if (type === PanelItemType.Feedback) {
    showFeedback()
  } else if (type === PanelItemType.Share) {
    showShareConfigModal({
      bookmarkId: Number(id),
      title: window.document.title,
      type: ShareModalType.Original
    })
  } else if (type === PanelItemType.Chat) {
    showChatbot()
  } else if (type === PanelItemType.AI) {
    showAnalyzed()
  }
}

const checkIframeContentValid = () => {
  if (!iframeRef.value) {
    return false
  }

  const iframeContent = iframeRef.value.contentDocument?.body.innerText
  if (!iframeContent) {
    return false
  }

  try {
    const res = JSON.parse(iframeContent)
    if (res && 'error' in res && 'url' in res && 'proxyUrl' in res && 'timestamp' in res && 'details' in res) {
      const isInvalid = res.url === inlineBookmarkDetail.value!.target_url
      return !isInvalid
    }
  } catch (e) {
    return true
  }

  return true
}

const refreshIframe = () => {
  if (!isNeedRefresh.value) return

  isNeedRefresh.value = false
  requestAndInjectIframe()
}

const injectInlineScript = async () => {
  document.title = `Slax Reader - ${inlineBookmarkDetail.value?.title}`
  iframeRef.value!.src = `/sw/liveproxy/mp_/${inlineBookmarkDetail.value!.target_url}`

  await new Promise<void>(resolve => {
    const loadHandler = () => {
      iframeRef.value?.removeEventListener('load', loadHandler)
      resolve()
    }
    iframeRef.value?.addEventListener('load', loadHandler)
  })

  if (!iframeRef.value) throw new Error('iframeRef is not supported')

  if (!checkIframeContentValid()) {
    isNeedRefresh.value = true
    return false
  }

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

  const titleEle = iframeDocument.value?.querySelector('title')
  titleEle &&
    new MutationObserver(function (mutations) {
      window.document.title = 'Slax Reader - ' + mutations[0].target.textContent || ''
    }).observe(titleEle, { subtree: true, characterData: true, childList: true })

  injectCssToIframe()

  return true
}

const initInlineScript = async () => {
  if (!navigator.serviceWorker) throw new Error('navigator.serviceWorker is not supported')

  await navigator.serviceWorker.register('/liveproxy-sw.js', { scope: '/sw' })

  if (!navigator.serviceWorker.controller) {
    await new Promise<void>(resolve => {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        resolve()
      })
    })
  }

  navigator.serviceWorker.controller!.postMessage({
    msg_type: 'init',
    proxy_prefix: '/sw/liveproxy',
    proxy_prefix_regexp: '(?:\/proxy\/(?:([0-9]*)([a-z]{2,3})_)?\/|\/sw\/liveproxy\/(?:([a-z]{2,3})_)?\/)(https?:\/\/.+)'
  })

  await new Promise<void>(resolve => {
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data.msg_type === 'init_done') {
        resolve()
      }
    })
  })
}

const requestAndInjectIframe = async () => {
  start()
  const res = await injectInlineScript()
  res && (await highlightMarks())
  finish()
}

const initInline = async () => {
  await initInlineScript()
  await loadInlineBookmarkDetail()
  await requestAndInjectIframe()
}

const {
  user,
  isSubscriptionExpired,
  isPanelShowing,
  panelType,
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
      type: BookmarkType.Share,
      title: title.value,
      shareCode: id
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

    .status {
      --style: fixed inset-0 flex-center select-none text-(slate lg);

      .loading,
      .refresh {
        --style: relative p-10 flex-1 flex-center max-w-3xl min-h-screenz-100;
      }

      .refresh {
        --style: flex-col;
      }

      .refresh {
        span {
          --style: mt-16px text-(14px #999) line-height-20px;
        }

        button {
          --style: 'mt-100px w-274px h-48px text-(15px #1f1f1f) font-bold rounded-3xl bg-white border-(1px solid #6a6e8333) flex-center hover:(opacity-90 scale-105) transition-all duration-250';
        }
      }
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
