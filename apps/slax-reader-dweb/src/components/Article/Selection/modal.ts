import { createApp } from 'vue'

import ArticleSelectionMenus from './ArticleSelectionMenus.vue'
import ArticleSelectionPanel from './ArticleSelectionPanel.vue'

import type { MarkItemInfo, MenuType } from './type'

const isNullRect = (rect: DOMRect) => {
  return !rect || (rect.width === 0 && rect.height === 0 && rect.top === 0 && rect.left === 0)
}

const showMenus = (options: {
  container: HTMLDivElement
  event: MouseEvent | TouchEvent
  allowAction: boolean
  callback?: (type: MenuType, event: MouseEvent) => void
  positionCallback?: (position: { x: number; y: number }) => void
  noActionCallback?: () => void
}) => {
  const { container, event, allowAction, callback, positionCallback, noActionCallback } = options
  const key = `article-selection-menus-container`
  const panelKey = `article-selection-panel-container`
  if (container.querySelector(`.${panelKey}`)) {
    return
  }

  let articleSelectionMenus = container.querySelector(`.${key}`) as HTMLElement
  if (articleSelectionMenus) {
    articleSelectionMenus.remove()
  }

  articleSelectionMenus = document.createElement('div')
  articleSelectionMenus.classList.add(key)
  articleSelectionMenus.style.setProperty('z-index', `${999}`)
  articleSelectionMenus.style.setProperty('position', `absolute`)

  container.appendChild(articleSelectionMenus)

  const app = createApp(ArticleSelectionMenus, {
    allowAction,
    onDismiss: () => {
      app.unmount()
      articleSelectionMenus.remove()
    },
    onAction: (type: MenuType, event: MouseEvent) => {
      callback && callback(type, event)
    },
    onNoAction: () => {
      noActionCallback && noActionCallback()
    }
  })

  app.mount(articleSelectionMenus)

  const selection = window.getSelection()
  if (!selection || !selection.rangeCount) return
  const range = selection.getRangeAt(0)
  if (!range) {
    return
  }

  if (range.startOffset === range.endOffset && range.startContainer === range.endContainer) {
    return
  }

  let offsetX = event instanceof MouseEvent ? event.clientX : event.changedTouches[0].clientX
  let offsetY = event instanceof MouseEvent ? event.clientY : event.changedTouches[0].clientY

  const bookmarkRect = container.getBoundingClientRect()
  if (bookmarkRect) {
    offsetY -= bookmarkRect.top
  }

  nextTick(() => {
    const scrollOffsetY = window.scrollY
    const menuRect = articleSelectionMenus.getBoundingClientRect()
    if (menuRect) {
      const gap = 10
      offsetX -= (menuRect.width * 1) / 4

      if (offsetY - menuRect.height - gap < scrollOffsetY || !(event instanceof MouseEvent)) {
        offsetY += menuRect.height + gap
      } else {
        offsetY -= menuRect.height + gap
      }
    }

    const articleRect = container.getBoundingClientRect()
    if (articleRect) {
      offsetX -= articleRect.left
      if (offsetX < 0) {
        offsetX = 0
      }

      if (offsetX + menuRect.width > articleRect.width) {
        offsetX = articleRect.width - menuRect.width
      }
    }

    articleSelectionMenus.style.setProperty('left', `${offsetX}px`)
    articleSelectionMenus.style.setProperty('top', `${offsetY}px`)

    positionCallback && positionCallback({ x: offsetX, y: offsetY })
  })
}

const showPanel = (options: {
  container: HTMLDivElement
  articleDom: HTMLDivElement
  info: MarkItemInfo
  bookmarkUserId: number
  allowAction: boolean
  fallbackYOffset: number
  actionCallback?: (type: MenuType, meta: { comment: string; info: MarkItemInfo; replyToId?: number; event?: MouseEvent }) => void
  commentDeleteCallback?: (id: string, markId: number) => void
  dismissCallback?: () => void
}) => {
  const { container, articleDom, info, allowAction, bookmarkUserId, actionCallback, commentDeleteCallback, dismissCallback } = options

  const key = `article-selection-panel-container`

  let articleSelectionPanel = container.querySelector(`.${key}`) as HTMLElement
  if (articleSelectionPanel) {
    articleSelectionPanel.remove()
  }

  articleSelectionPanel = document.createElement('div')
  articleSelectionPanel.classList.add(key)
  articleSelectionPanel.style.setProperty('z-index', `${999}`)
  articleSelectionPanel.style.setProperty('position', `absolute`)

  container.appendChild(articleSelectionPanel)

  // 用于记录初次的高度
  let initedTopHeight = 0
  let panel: InstanceType<typeof ArticleSelectionPanel> | null = null
  // 因为有不止一处用到这块逻辑因此抽离出来
  const updatePanelOffset = () => {
    const innerHeight = window.innerHeight
    const containerRect = container.getBoundingClientRect()
    const panelRect = articleSelectionPanel.getBoundingClientRect()
    const articleRect = articleDom.getBoundingClientRect()
    if (panelRect && articleRect) {
      let offsetX = articleRect.width + 60
      if (articleRect.left + offsetX + panelRect.width > window.innerWidth) {
        offsetX -= articleRect.left + offsetX + panelRect.width - window.innerWidth
      }

      articleSelectionPanel.style.setProperty('left', `${offsetX}px`)

      if (panelRect.top + panelRect.height > containerRect.top + containerRect.height) {
        const topOffset = Math.max(0, containerRect.height - panelRect.height)
        articleSelectionPanel.style.setProperty('top', `${topOffset}px`)
      } else {
        if (panelRect.top - containerRect.top !== initedTopHeight) {
          const isOverflowBefore = initedTopHeight + containerRect.top + panelRect.height > containerRect.top + containerRect.height
          if (isOverflowBefore) {
            const topOffset = Math.max(0, containerRect.height - panelRect.height)
            articleSelectionPanel.style.setProperty('top', `${topOffset}px`)
          } else {
            articleSelectionPanel.style.setProperty('top', `${initedTopHeight}px`)
          }
        }
      }
    }

    panel?.maxHeightUpdate(Math.min(containerRect.height, innerHeight * 0.8))
  }

  const app = createApp(ArticleSelectionPanel, {
    info,
    bookmarkUserId,
    allowAction,
    onDismiss: () => {
      app.unmount()
      articleSelectionPanel.remove()
      dismissCallback && dismissCallback()
    },
    onAction: (type: MenuType, meta: { comment: string; info: MarkItemInfo; event: MouseEvent }) => {
      actionCallback && actionCallback(type, meta)
    },
    onCommentDelete: (params: { id: string; markId: number }) => {
      commentDeleteCallback && commentDeleteCallback(params.id, params.markId)
    },
    onWindowResize: () => {
      updatePanelOffset()
    }
  })

  panel = app.mount(articleSelectionPanel) as InstanceType<typeof ArticleSelectionPanel>
  const selection = window.getSelection()

  let topOffset = 0
  if (!selection || !selection.rangeCount) {
    topOffset = options.fallbackYOffset
  } else {
    const range = selection.getRangeAt(0)
    const rect = range?.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    const isZeroRect = isNullRect(rect)
    if (isZeroRect && range.startContainer instanceof HTMLElement) {
      topOffset = range.startContainer.getBoundingClientRect().top - containerRect.top + 10
    } else if (!isZeroRect) {
      topOffset = rect.top - containerRect.top - 50
    }
  }

  initedTopHeight = topOffset
  const top = topOffset > 0 ? `${topOffset}px` : ''
  articleSelectionPanel.style.setProperty('top', top)

  nextTick(() => {
    updatePanelOffset()

    panel.positionConfirmedHandler()
  })
}

export default {
  showMenus,
  showPanel
}
