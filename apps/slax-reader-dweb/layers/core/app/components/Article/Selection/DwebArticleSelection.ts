import { getElementFullSelector } from '@commons/utils/dom'

import { getUUID } from './tools'
import { ArticleSelection as BaseArticleSelection, type IMarkModal } from '@slax-reader/selection'
import type { SelectionDependencies } from '@slax-reader/selection/adapters'
import type { MarkItemInfo, MarkPathItem, MarkSelectContent, MenuType, QuoteData, SelectionConfig, SelectTextInfo } from '@slax-reader/selection/types'

/**
 * Dweb端ArticleSelection扩展
 *
 * 继承自commons/selection的基础实现，添加dweb特定的业务逻辑
 */
export class DwebArticleSelection extends BaseArticleSelection {
  private modal: IMarkModal

  constructor(config: SelectionConfig, dependencies: SelectionDependencies, modal: IMarkModal) {
    super(config, dependencies, modal)
    this.modal = modal
  }

  /** 取消本人划线，留评论 */
  async deleteStroke(info: MarkItemInfo) {
    await this.manager.deleteStroke(info)
  }

  /**
   * 重写handleMouseUp以实现dweb特定的选择处理逻辑
   */
  protected override async handleMouseUp(e: MouseEvent | TouchEvent) {
    this.monitor.clearMouseListenerTry()

    setTimeout(() => {
      if (this.modal.isPanelExist(this.config.containerDom!)) {
        return
      }

      const target = e.target as HTMLElement | null
      if (target?.tagName === 'IMG' && this.isImageInContent(target as HTMLImageElement)) {
        const sel = this.getSelection()
        const hasTextSelection = !!sel && sel.rangeCount > 0 && !sel.isCollapsed && sel.toString().trim().length > 0
        if (!hasTextSelection) {
          this.handleImageSelection(e, target as HTMLImageElement)
          return
        }
      }

      const selection = this.getSelection()
      if (!selection || !selection.rangeCount) {
        this.manager.updateCurrentMarkItemInfo(null)
        return
      }

      const range = selection.getRangeAt(0)
      const { list, approx } = this.manager.getElementInfo(range)

      if (!list || list.length === 0 || !approx) {
        this.manager.updateCurrentMarkItemInfo(null)
        return
      }

      const source = this.getMarkPathItems(list)
      if (!source) return

      const markInfoItem = this.markItemInfos.value.find(infoItem => this.manager.checkMarkSourceIsSame(infoItem.source, source))
      if (markInfoItem) {
        this.manager.updateCurrentMarkItemInfo(markInfoItem)
        // 精确选中一条已有划线：弹出选区菜单（划线项变「删除划线」），让用户能取消划线；
        // 纯评论、无划线的标记仍直接打开评论侧栏。
        if (markInfoItem.stroke.length > 0) {
          this.showExistingMarkMenus(e, markInfoItem)
        } else {
          this.manager.showPanel()
        }
        return
      }

      const currentMark = this.currentMarkItemInfo.value
      if (currentMark?.id === '' && this.manager.checkMarkSourceIsSame(currentMark.source, source)) return
      this.manager.updateCurrentMarkItemInfo({ id: '', source, comments: [], stroke: [], approx })
      this.manager.clearSelectContent()

      list.forEach((item: SelectTextInfo) => {
        const lastContent = this.selectContent.value[this.selectContent.value.length - 1]
        const newContent: MarkSelectContent = {
          type: item.type,
          text: item.type === 'text' ? item.text : '',
          src: item.type === 'image' ? item.src : ''
        }
        newContent.text = newContent.text.replace(/\n/g, '')
        if (lastContent?.type === 'text' && item.type === 'text') {
          lastContent.text += item.text
        } else {
          this.manager.pushSelectContent(newContent)
        }
      })

      let menusY = 0
      this.modal.showMenus({
        event: e,
        callback: (type: MenuType, event: MouseEvent) => {
          const currentInfo = this.currentMarkItemInfo.value
          if (!currentInfo) return

          if (type === ('stroke' as MenuType)) {
            currentInfo.id = getUUID()
            this.manager.strokeSelection({ info: currentInfo })
          } else if (type === ('copy' as MenuType)) {
            this.manager.copyMarkedText({ source, event })
          } else if (type === ('comment' as MenuType)) {
            currentInfo.id = getUUID()
            const isInline = !this.config.iframe
            if (isInline) {
              // inline 模式：补齐 quote 聚合，派发事件给 Vue 宿主消费
              const quote: QuoteData = {
                source: {},
                data: this.createQuote(currentInfo.source)
              }
              const sel = this.getSelection()
              const range = sel?.rangeCount ? sel.getRangeAt(0) : undefined
              const selected = this.manager.getElementsList(range!)
              if (!selected || selected.length === 0) {
                quote.source.selection = range
              } else {
                const paths = this.getMarkPathItems(selected)
                quote.source.paths = paths || (range ? undefined : [])
                if (!paths && range) quote.source.selection = range
              }
              window.dispatchEvent(
                new CustomEvent('slax:open-comment-panel', {
                  detail: { kind: 'new', info: { ...currentInfo }, quote }
                })
              )
            } else {
              // iframe 模式：保留原 CE Panel 渲染
              this.manager.showPanel({ fallbackYOffset: menusY })
            }
          } else if (type === ('chatbot' as MenuType) && this.config.postQuoteDataHandler) {
            const quote: QuoteData = {
              source: {},
              data: this.createQuote(currentInfo.source)
            }
            const selection = this.getSelection()
            const range = selection?.rangeCount ? selection.getRangeAt(0) : undefined
            const selected = this.manager.getElementsList(range!)

            if (!selected || selected.length === 0) {
              quote.source.selection = range
            } else {
              const paths = this.getMarkPathItems(selected)
              quote.source.paths = paths || (range ? undefined : [])
              if (!paths && range) quote.source.selection = range
            }

            this.config.postQuoteDataHandler!(quote)
            this.findQuote(quote)
          }

          if (type !== ('comment' as MenuType)) this.clearSelection()
        },
        positionCallback: ({ y }) => (menusY = y),
        noActionCallback: () => {
          this.manager.updateCurrentMarkItemInfo(null)
          this.manager.clearSelectContent()
        }
      })
    }, 0)
  }

  private isImageInContent(img: HTMLElement): boolean {
    const root = !this.config.iframe ? (this.config.monitorDom?.querySelector('.html-text') as HTMLElement | null) : this.config.containerDom
    return !!root && root.contains(img)
  }

  private handleImageSelection(e: MouseEvent | TouchEvent, img: HTMLImageElement) {
    const source = this.getMarkPathItems([{ type: 'image', src: img.src, ele: img }])
    if (!source || source.length === 0) return

    this.manager.updateCurrentMarkItemInfo({ id: '', source, comments: [], stroke: [], approx: undefined })
    this.manager.clearSelectContent()
    this.manager.pushSelectContent({ type: 'image', text: '', src: img.src })

    let menusY = 0
    this.modal.showMenus({
      event: e,
      callback: (type: MenuType, event: MouseEvent) => {
        const currentInfo = this.currentMarkItemInfo.value
        if (!currentInfo) return

        if (type === ('stroke' as MenuType)) {
          currentInfo.id = getUUID()
          this.manager.strokeSelection({ info: currentInfo })
        } else if (type === ('copy' as MenuType)) {
          this.manager.copyMarkedText({ source, event })
        } else if (type === ('comment' as MenuType)) {
          currentInfo.id = getUUID()
          const isInline = !this.config.iframe
          if (isInline) {
            const quote: QuoteData = { source: { paths: source }, data: this.createQuote(source) }
            window.dispatchEvent(
              new CustomEvent('slax:open-comment-panel', {
                detail: { kind: 'new', info: { ...currentInfo }, quote }
              })
            )
          } else {
            this.manager.showPanel({ fallbackYOffset: menusY })
          }
        } else if (type === ('chatbot' as MenuType) && this.config.postQuoteDataHandler) {
          const quote: QuoteData = { source: { paths: source }, data: this.createQuote(source) }
          this.config.postQuoteDataHandler!(quote)
          this.findQuote(quote)
        }

        if (type !== ('comment' as MenuType)) this.clearSelection()
      },
      positionCallback: ({ y }) => (menusY = y),
      noActionCallback: () => {
        this.manager.updateCurrentMarkItemInfo(null)
        this.manager.clearSelectContent()
      }
    })
  }

  /**
   * 精确命中已有划线时的选区菜单：复制 / 删除划线 / 评论 / Chat。
   * 与新选区菜单（handleMouseUp 内联块）分开，避免误改已存在标记的 id 语义。
   */
  private showExistingMarkMenus(e: MouseEvent | TouchEvent, info: MarkItemInfo) {
    let menusY = 0
    this.modal.showMenus({
      event: e,
      isStroked: true,
      callback: (type: MenuType, event: MouseEvent) => {
        if (type === ('stroke_delete' as MenuType)) {
          this.manager.deleteStroke(info)
        } else if (type === ('copy' as MenuType)) {
          this.manager.copyMarkedText({ source: info.source, approx: info.approx, event })
        } else if (type === ('comment' as MenuType)) {
          // 已有标记追加评论：打开评论侧栏（inline 下派发 existing 事件），保留选区
          this.manager.showPanel({ fallbackYOffset: menusY })
          return
        } else if (type === ('chatbot' as MenuType) && this.config.postQuoteDataHandler) {
          const quote: QuoteData = { source: { id: info.id }, data: this.createQuote(info.source, info.approx) }
          this.config.postQuoteDataHandler(quote)
          this.findQuote(quote)
        }

        this.clearSelection()
      },
      positionCallback: ({ y }) => (menusY = y),
      noActionCallback: () => {
        this.manager.updateCurrentMarkItemInfo(null)
        this.manager.clearSelectContent()
      }
    })
  }

  /**
   * 从选择信息生成标记路径项
   */
  private getMarkPathItems(infos: SelectTextInfo[]): MarkPathItem[] | null {
    const markItems: MarkPathItem[] = []
    const ele = !this.config.iframe ? this.config.monitorDom?.querySelector('.html-text') : null

    for (const info of infos) {
      if (info.type === 'text') {
        const selector = getElementFullSelector(info.node!.parentElement!, ['slax-mark'], ele!)
        const baseElement = this.config.monitorDom?.querySelector(selector) as HTMLElement
        if (!baseElement) return null

        const nodes = this.renderer.getAllTextNodes(baseElement)
        const nodeLengths = nodes.map((node: Node) => (node.textContent || '').length)
        const nodeIndex = nodes.indexOf(info.node as Node)
        if (nodeIndex === -1) continue

        const base = nodeLengths.slice(0, nodeIndex).reduce((acc: number, cur: number) => acc + cur, 0)
        markItems.push({ type: 'text', path: selector, start: base + info.startOffset, end: base + info.endOffset })
      } else if (info.type === 'image') {
        const selector = getElementFullSelector(info.ele as HTMLElement, ['slax-mark'], ele!)
        const baseElement = this.config.monitorDom?.querySelector(selector) as HTMLElement
        if (!baseElement) return null
        markItems.push({ type: 'image', path: selector })
      }
    }
    return markItems
  }
}
