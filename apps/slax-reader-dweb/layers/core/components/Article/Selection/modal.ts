import { createApp, defineCustomElement } from 'vue'

import ArticleSelectionMenus from './ArticleSelectionMenus.ce.vue'
import ArticleSelectionPanel from './ArticleSelectionPanel.vue'

import { Base } from './base'
import type { MarkItemInfo, MenuType, SelectionConfig } from './type'

const ArticleSelectionMenusElement = defineCustomElement(ArticleSelectionMenus)
customElements.define('article-seletion-menus', ArticleSelectionMenusElement)

const menusKey = `slax-reader-article-selection-menus-container`
const panelKey = `slax-reader-article-selection-panel-container`

const isNullRect = (rect: DOMRect) => {
  return !rect || (rect.width === 0 && rect.height === 0 && rect.top === 0 && rect.left === 0)
}

export class MarkModal extends Base {
  constructor(config: SelectionConfig) {
    super(config)
  }

  isPanelExist = (container?: HTMLDivElement) => {
    const articleSelectionPanel = (container || this.document).querySelector(`.${panelKey}`) as HTMLElement
    return !!articleSelectionPanel
  }

  showMenus = (options: {
    event: MouseEvent | TouchEvent
    callback?: (type: MenuType, event: MouseEvent) => void
    positionCallback?: (position: { x: number; y: number }) => void
    noActionCallback?: () => void
  }) => {
    const { event, callback, positionCallback, noActionCallback } = options
    const { containerDom, allowAction } = this.config

    if (!containerDom || this.isPanelExist(containerDom)) {
      return
    }

    let articleSelectionMenus: HTMLElement | null = null

    if (!this.config.iframe) {
      articleSelectionMenus = containerDom.querySelector(`.${menusKey}`) as HTMLElement
      if (articleSelectionMenus) {
        articleSelectionMenus.remove()
      }

      articleSelectionMenus = this.document.createElement('div')
      articleSelectionMenus.classList.add(menusKey)
      articleSelectionMenus.style.setProperty('z-index', `${999}`)
      articleSelectionMenus.style.setProperty('position', `absolute`)

      containerDom.appendChild(articleSelectionMenus)
    } else {
      let bgDom = this.document.querySelector(`.${menusKey}-bg`) as HTMLElement
      if (!bgDom) {
        bgDom = this.document.createElement('div')
        bgDom.classList.add(`${menusKey}-bg`)
        bgDom.style.position = 'relative'
        bgDom.style.width = '100%'
        bgDom.style.height = '0px'
        bgDom.style.margin = '0px'
        bgDom.style.padding = '0px'
        bgDom.style.border = '0px'
        this.document.documentElement.insertBefore(bgDom, this.document.body)
      }

      articleSelectionMenus = this.document.querySelector(`.${menusKey}`) as HTMLElement
      if (articleSelectionMenus) {
        articleSelectionMenus.remove()
      }

      articleSelectionMenus = this.document.createElement('div')
      articleSelectionMenus.classList.add(menusKey)
      articleSelectionMenus.style.zIndex = '999'
      articleSelectionMenus.style.position = 'absolute'
      articleSelectionMenus.style.padding = '0px'
      articleSelectionMenus.style.border = '0px'
      articleSelectionMenus.style.width = 'auto'
      articleSelectionMenus.style.height = 'auto'
      articleSelectionMenus.style.background = 'transparent'
      articleSelectionMenus.style.backgroundColor = 'transparent'

      bgDom.appendChild(articleSelectionMenus)
    }

    if (!articleSelectionMenus) {
      return
    }

    const menusElement = new ArticleSelectionMenusElement({
      allowAction,
      dark: !!this.config.iframe
    })

    const onDismiss = () => {
      articleSelectionMenus.remove()
    }
    const onAction = (type: MenuType, event: MouseEvent) => {
      callback && callback(type, event)
    }
    const onNoAction = () => {
      noActionCallback && noActionCallback()
    }

    menusElement.addEventListener('dismiss', onDismiss)
    menusElement.addEventListener('action', (e: Event) => {
      const customEvent = e as CustomEvent<[MenuType, MouseEvent]>
      onAction(customEvent.detail[0], customEvent.detail[1])
    })

    menusElement.addEventListener('noAction', onNoAction)
    articleSelectionMenus.appendChild(menusElement)

    const selection = this.window.getSelection()
    if (!selection || !selection.rangeCount) return
    const range = selection.getRangeAt(0)
    if (!range) {
      return
    }

    if (range.startOffset === range.endOffset && range.startContainer === range.endContainer) {
      return
    }

    const MEvent = this.config.iframe ? (this.window as Window & typeof globalThis).MouseEvent : MouseEvent

    let offsetX = 0
    let offsetY = 0

    if (!this.config.iframe) {
      offsetX = event instanceof MEvent ? (event as MouseEvent).clientX : (event as TouchEvent).changedTouches[0].clientX
      offsetY = event instanceof MEvent ? (event as MouseEvent).clientY : (event as TouchEvent).changedTouches[0].clientY

      const bookmarkRect = containerDom.getBoundingClientRect()
      if (bookmarkRect) {
        offsetY -= bookmarkRect.top
      }
    } else {
      const bodyRect = this.config.iframe.contentDocument?.body.getBoundingClientRect()
      const rangeRect = range.getBoundingClientRect()
      offsetX = rangeRect.left - (bodyRect?.left || 0)
      offsetY = rangeRect.top - (bodyRect?.top || 0)
    }

    nextTick(() => {
      const menuRect = articleSelectionMenus.getBoundingClientRect()
      const scrollOffsetY = this.window.scrollY
      if (menuRect) {
        const gap = 10
        offsetX -= (menuRect.width * 1) / 4

        if (offsetY - menuRect.height - gap < scrollOffsetY || !(event instanceof MEvent)) {
          offsetY += menuRect.height + gap
        } else {
          offsetY -= menuRect.height + gap
        }
      }

      if (!this.config.iframe) {
        const articleRect = containerDom.getBoundingClientRect()
        if (articleRect) {
          offsetX -= articleRect.left
          if (offsetX < 0) {
            offsetX = 0
          }

          if (offsetX + menuRect.width > articleRect.width) {
            offsetX = articleRect.width - menuRect.width
          }
        }
      }

      articleSelectionMenus.style.setProperty('left', `${offsetX}px`)
      articleSelectionMenus.style.setProperty('top', `${offsetY}px`)

      positionCallback && positionCallback({ x: offsetX, y: offsetY })
    })
  }

  showPanel = (options: {
    info: MarkItemInfo
    fallbackYOffset: number
    actionCallback?: (type: MenuType, meta: { comment: string; info: MarkItemInfo; replyToId?: number; event?: MouseEvent }) => void
    commentDeleteCallback?: (id: string, markId: number) => void
    dismissCallback?: () => void
  }) => {
    const { info, actionCallback, commentDeleteCallback, dismissCallback } = options
    const { containerDom, allowAction, ownerUserId } = this.config
    if (!containerDom) {
      return
    }

    let articleSelectionPanel = containerDom.querySelector(`.${panelKey}`) as HTMLElement
    if (articleSelectionPanel) {
      articleSelectionPanel.remove()
    }

    articleSelectionPanel = this.document.createElement('div')
    articleSelectionPanel.classList.add(panelKey)
    articleSelectionPanel.style.setProperty('z-index', `${999}`)
    articleSelectionPanel.style.setProperty('position', `absolute`)

    containerDom.appendChild(articleSelectionPanel)

    // 用于记录初次的高度
    let initedTopHeight = 0
    let panel: InstanceType<typeof ArticleSelectionPanel> | null = null

    // 因为有不止一处用到这块逻辑因此抽离出来
    const updatePanelOffset = () => {
      const innerHeight = window.innerHeight
      const containerRect = containerDom.getBoundingClientRect()
      const panelRect = articleSelectionPanel.getBoundingClientRect()
      const articleRect = containerDom.getBoundingClientRect()
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
      ownerUserId,
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
      const containerRect = containerDom.getBoundingClientRect()

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
}
