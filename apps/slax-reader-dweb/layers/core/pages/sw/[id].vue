<template>
  <div class="page-container">
    <div class="fixed-loading-container">
      <Transition name="list-loading">
        <div class="loading-indicator" v-show="false">
          <div class="loading-spinner"></div>
        </div>
      </Transition>
    </div>
    <div class="header">
      <div class="left">
        <button class="app-name" @click="navigateToBookmarks">Slax Reader</button>
        <ClientOnly><ProIcon /></ClientOnly>
      </div>
      <div class="right">
        <ClientOnly>
          <UserNotification v-if="user" :iconStyle="UserNotificationIconStyle.TINY" @checkAll="navigateToNotification" />
          <div class="right-operates">
            <OperatesBar />
          </div>
        </ClientOnly>
      </div>
    </div>

    <div class="content-container">
      <div class="iframe-wrapper">
        <iframe
          id="content"
          ref="iframeRef"
          sandbox="allow-downloads allow-modals allow-orientation-lock allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-presentation allow-scripts allow-same-origin allow-forms"
          class="iframe-content"
        ></iframe>
      </div>

      <div class="comment-section">
        <div class="comment-header">
          <h3>评论列表</h3>
        </div>
        <div class="comment-list">
          <div class="comment-empty">暂无评论</div>
        </div>
        <div class="comment-input">
          <textarea placeholder="写下你的评论..." rows="3"></textarea>
          <button class="submit-btn">发送</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import OperatesBar from '#layers/core/components/global/OperatesBar.vue'
import UserNotification, { UserNotificationIconStyle } from '#layers/core/components/Notification/UserNotification.vue'

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
  iframeRef.value!.src = `/sw/liveproxy/mp_/${inlineBookmarkDetail.value!.target_url}`

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
  }).observe(iframeDocument.value?.querySelector('title')!, { subtree: true, characterData: true, childList: true })

  // get event message from iframe
  window.addEventListener('message', handleEventMessage)
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
.page-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: hidden;
}

.fixed-loading-container {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  height: 0px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.loading-indicator {
  height: 30px;
  width: 30px;
  transform: translateY(50px);
  border-radius: 9999px;
  background-color: #fff;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: -30px;
}

.loading-spinner {
  font-size: 24px;
  color: #16b998;
  background-image: url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cstyle%3E.spinner_P7sC%7Banimation:spinner_MGfb .8s linear infinite;animation-delay:-.8s%7D.spinner_PyDf%7Banimation-delay:-.65s%7D.spinner_RaKf%7Banimation-delay:-.5s%7D@keyframes spinner_MGfb%7B0%25%7Bx:4px;y:4px;width:16px;height:16px;opacity:.3%7D25%25%7Bx:4px;y:4px;width:16px;height:16px;opacity:.3%7D50%25%7Bx:1px;y:1px;width:22px;height:22px;opacity:1%7D75%25%7Bx:4px;y:4px;width:16px;height:16px;opacity:.3%7D100%25%7Bx:4px;y:4px;width:16px;height:16px;opacity:.3%7D%7D%3C/style%3E%3Crect class='spinner_P7sC' x='4' y='4' width='16' height='16' rx='8' ry='8' fill='%2316b998' opacity='.5'/%3E%3Crect class='spinner_P7sC spinner_PyDf' x='4' y='4' width='16' height='16' rx='8' ry='8' fill='%2316b998' opacity='.5'/%3E%3Crect class='spinner_P7sC spinner_RaKf' x='4' y='4' width='16' height='16' rx='8' ry='8' fill='%2316b998' opacity='.5'/%3E%3C/svg%3E");
  width: 24px;
  height: 24px;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 44px;
  z-index: 10;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
  background-color: #f5f5f3;
}

.header .left {
  height: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  position: relative;
  padding-left: 60px;
}

@media (max-width: 768px) {
  .header .left {
    padding-left: 40px;
  }
}

.header .left .app-name {
  font-weight: 600;
  color: #16b998;
  font-size: 15px;
  line-height: 21px;
  cursor: pointer;
}

.header .left > *:not(:first-child) {
  margin-left: 8px;
  flex-shrink: 0;
}

.header .right {
  height: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  position: relative;
}

.header .right .right-operates {
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .header .right .right-operates {
    justify-content: flex-end;
  }
}

@media (min-width: 769px) {
  .header .right .right-operates {
    justify-content: flex-start;
    flex: 1;
  }
}

.header .right .right-operates > *:not(:first-child) {
  margin-left: 16px;
}

.header .right .right-operates .user-notification:not(:last-child) {
  margin-right: 16px;
}

.content-container {
  width: 100%;
  display: flex;
  justify-content: center;
  background-color: #fcfcfc;
  padding-top: 44px;
}

@media (max-width: 768px) {
  .content-container {
    flex-direction: column;
  }
}

@media (min-width: 769px) {
  .content-container {
    flex-direction: row;
  }
}

.iframe-wrapper {
  position: relative;
  flex: 1;
  height: calc(100vh - 44px);
}

.iframe-wrapper .iframe-content {
  width: 100%;
  height: 100%;
  border: none;
}

.comment-section {
  width: 320px;
  height: calc(100vh - 44px);
  background-color: white;
  border-left: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .comment-section {
    display: none;
  }
}

.comment-section .comment-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.comment-section .comment-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.comment-section .comment-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.comment-section .comment-list .comment-empty {
  color: #999;
  text-align: center;
  padding-top: 20px;
  padding-bottom: 20px;
}

.comment-section .comment-input {
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

.comment-section .comment-input textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  resize: none;
  margin-bottom: 8px;
  font: inherit;
}

.comment-section .comment-input .submit-btn {
  background-color: #16b998;
  color: white;
  border: none;
  border-radius: 4px;
  padding-left: 16px;
  padding-right: 16px;
  padding-top: 8px;
  padding-bottom: 8px;
  float: right;
  cursor: pointer;
}

.comment-section .comment-input .submit-btn:hover {
  background-color: #12a589;
}

.list-loading-enter-active,
.list-loading-leave-active {
  transition: transform 0.4s;
}

.list-loading-enter-from,
.list-loading-leave-to {
  transform: translateY(-10px);
}
</style>

<!-- eslint-disable-next-line vue-scoped-css/enforce-style-type -->
<style lang="scss">
html {
  background-color: #fcfcfc;
}
</style>
