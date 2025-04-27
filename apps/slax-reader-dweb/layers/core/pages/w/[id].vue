<template>
  <div class="raw-web">
    <div class="header">
      <div class="left">
        <div class="items-wrapper">
          <img src="@images/logo-sm.png" alt="" />
          <span class="title">{{ $t('common.app.name') }}</span>
          <ProIcon />
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
      <div class="iframe-wrapper relative">
        <iframe
          id="content"
          ref="iframeRef"
          sandbox="allow-downloads allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-scripts allow-same-origin allow-forms"
          class="iframe-content"
        ></iframe>
        <div class="absolute inset-0" v-if="isDragging" @click.stop></div>
      </div>
      <RawWebPanel @is-dragging="val => (isDragging = val)" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import OperatesBar from '#layers/core/components/global/OperatesBar.vue'
import UserNotification, { UserNotificationIconStyle } from '#layers/core/components/Notification/UserNotification.vue'
import RawWebPanel from '#layers/core/components/RawWebPanel.vue'

import { RequestMethodType } from '@commons/utils/request'

import { ArticleSelection } from '../../components/Article/Selection/selection'
import { RESTMethodPath } from '@commons/types/const'
import type { InlineBookmarkDetail } from '@commons/types/interface'
import { registerComponents, SelectionMenusElement } from '#layers/core/components/Article/CEComponents'
import { useUserStore } from '#layers/core/stores/user'

const route = useRoute()
const router = useRouter()
const id = String(route.params.id)
const iframeRef = ref<HTMLIFrameElement | null>(null)
const iframeDocument = ref<Document | null>(null)
const iframeWindow = ref<Window | null>(null)
const inlineBookmarkDetail = ref<InlineBookmarkDetail | null>(null)
const articleSelection = ref<ArticleSelection | null>(null)
const isDragging = ref(false)

const userStore = useUserStore()
const user = ref(userStore.userInfo || null)

const navigateToBookmarks = () => {
  router.push('/')
}

const navigateToNotification = () => {
  router.push('/notifications')
}

const highligText = () => {}

const emitEventCopy = (selection: Selection) => {
  const clipboardObj = navigator.clipboard
  if (!clipboardObj) return

  const range = selection.getRangeAt(0)
  const text = range.toString()
  clipboardObj.writeText(text)
}

const highlightMarks = async () => {}

const loadInlineBookmarkDetail = async () => {
  const res = await request.get<InlineBookmarkDetail>({
    url: RESTMethodPath.INLINE_BOOKMARK_DETAIL,
    method: RequestMethodType.get,
    query: {
      share_code: id
    }
  })
  if (!res) throw new Error('loadInlineBookmarkDetail failed')
  inlineBookmarkDetail.value = res
}

const emitEventStroke = (selection: Selection) => {}

const emitEventComment = (selection: Selection) => {}

const handleEventMessage = (e: MessageEvent) => {
  const selection = iframeWindow.value!.getSelection()
  if (!selection) return

  switch (e.data.type) {
    case 'menus_click_copy':
      emitEventCopy(selection)
      break
    case 'menus_click_stroke':
      emitEventStroke(selection)
      break
    case 'menus_click_comment':
      emitEventComment(selection)
      break
  }
}

const injectInlineScript = async () => {
  document.title = `Slax Reader - ${inlineBookmarkDetail.value?.title}`
  iframeRef.value!.src = `/w/liveproxy/mp_/${inlineBookmarkDetail.value!.target_url}`

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

  const menus = new SelectionMenusElement({
    allowAction: true
  })
  //@ts-ignore
  menus.appear = true

  const innerDom = iframeDocument.value!.createElement('div')
  innerDom.style.cssText = 'position: relative; width: 100%; height: 0px; margin: 0px; padding: 0px; border: 0px;'

  iframeDocument.value!.documentElement.insertBefore(innerDom, iframeDocument.value!.body)

  const menusContainer = iframeDocument.value!.createElement('div')
  menusContainer.style.cssText = 'position: absolute;'
  innerDom.appendChild(menusContainer)
  menusContainer.appendChild(menus)

  // show menus when mouse up
  iframeDocument.value!.addEventListener(
    'mouseup',
    (e: MouseEvent) => {
      const selection = iframeWindow.value!.getSelection()
      const bodyRect = iframeDocument.value!.body.getBoundingClientRect()
      //@ts-ignore
      const rangeRect = (selection.rangeCount ? selection.getRangeAt(0) : e.srcElement).getBoundingClientRect()
      menusContainer.style.top = rangeRect.top - bodyRect.top + 'px'
      menusContainer.style.left = rangeRect.left - bodyRect.left + 'px'
      menusContainer.style.zIndex = '99999'
      //@ts-ignore
      menus.appear = true
    },
    true
  )

  // hide menus when mouse leave
  iframeDocument.value!.addEventListener('mouseleave', (e: MouseEvent) => {
    //@ts-ignore
    menus.appear = false
  })

  // monitor title change
  new MutationObserver(function (mutations) {
    window.document.title = 'Slax Reader - ' + mutations[0].target.textContent || ''
  }).observe(iframeDocument.value!.querySelector('title')!, { subtree: true, characterData: true, childList: true })

  // get event message from iframe
  window.addEventListener('message', handleEventMessage)
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
    msg_type: 'init'
  })

  await new Promise<void>(resolve => {
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data.msg_type === 'init_done') {
        resolve()
      }
    })
  })
}

const initInline = async () => {
  await initInlineScript()
  await loadInlineBookmarkDetail()
  await injectInlineScript()
  await highlightMarks()
}

registerComponents()
initInline()
</script>

<style lang="scss" scoped>
.raw-web {
  --style: w-full h-100vh flex flex-col;

  .header {
    --style: 'w-full h-[var(--header-height)] z-10 p-0 flex items-center justify-between select-none bg-#f5f5f3';

    .left {
      --style: ml-40px h-full flex items-center relative;

      .items-wrapper {
        --style: absolute top-0 left-0 h-full flex items-center;

        & > * {
          --style: 'not-first:ml-8px shrink-0';
        }

        img {
          --style: w-20px;
        }

        .title {
          --style: font-semibold text-(#16b998 15px) line-height-21px;
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
    --style: relative size-full flex-1 flex justify-between items-center;
    .iframe-wrapper {
      --style: size-full border-none;

      .iframe-content {
        --style: size-full border-none;
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
