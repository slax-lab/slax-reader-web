import { getElementFullSelector, removeOuterTag } from '@commons/utils/dom'

import type { QuoteData } from '../../Chat/type'
import { Base } from './base'
import { MarkManager } from './manager'
import { MarkModal } from './modal'
import { SelectionMonitor } from './monitor'
import { MarkRenderer } from './renderer'
import { getUUID } from './tools'
import { MenuType, type SelectionConfig, type SelectTextInfo } from './type'
import { type MarkDetail, type MarkPathItem, MarkType } from '@commons/types/interface'

export class ArticleSelection extends Base {
  public monitor: SelectionMonitor
  public manager: MarkManager
  private renderer: MarkRenderer
  private modal: MarkModal

  constructor(config: SelectionConfig) {
    super(config)
    this.modal = new MarkModal(this.config)
    this.renderer = new MarkRenderer(this.config)
    this.manager = new MarkManager(this.config, this.renderer, this.modal, this.findQuote.bind(this))
    this.monitor = new SelectionMonitor(this.config, this.handleMouseUp.bind(this))
  }

  startMonitor() {
    this.monitor.start()
  }

  closeMonitor() {
    this.monitor.stop()
  }

  async drawMark(marks: MarkDetail) {
    await this.manager.drawMarks(marks)
  }

  findQuote(quote: QuoteData) {
    if (quote.source.selection) {
      const selection = this.getSelection()
      selection?.removeAllRanges()
      selection?.addRange(quote.source.selection)
      quote.source.selection.startContainer.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    } else if (quote.source.paths) {
      Array.from(this.document.querySelectorAll(`slax-mark[data-uuid="0"]`) || []).forEach(removeOuterTag)
      const baseInfo = { id: '0', isStroke: false, isComment: false, isSelfStroke: false, isHighlighted: true }
      for (const markItem of quote.source.paths) {
        const infos = this.renderer.transferNodeInfos(markItem)
        for (const info of infos) {
          if (info.type === 'image') {
            this.renderer.addImageMark({ ...baseInfo, ele: info.ele as HTMLImageElement })
          } else {
            this.renderer.addMark({ ...baseInfo, node: info.node, start: info.start, end: info.end })
          }
        }
      }

      const slaxMarks = Array.from(this.document.querySelectorAll(`slax-mark[data-uuid="0"]`))
      if (slaxMarks.length === 0) return

      slaxMarks[0].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
      const clickHandler = () => {
        slaxMarks.forEach(removeOuterTag)
        ;['mousedown', 'touchstart'].forEach(event => this.config.monitorDom?.removeEventListener(event, clickHandler))
      }
      ;['mousedown', 'touchstart'].forEach(event => this.config.monitorDom?.addEventListener(event, clickHandler))
    } else {
      const slaxMarks = Array.from(this.document.querySelectorAll(`slax-mark[data-uuid="${quote.source.id}"]`))
      if (slaxMarks.length === 0) return

      slaxMarks.forEach(mark => mark.classList.add('highlighted'))
      slaxMarks[0].scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })

      const clickHandler = () => {
        slaxMarks.forEach(mark => mark.classList.remove('highlighted'))
        this.config.monitorDom?.removeEventListener('click', clickHandler)
      }
      this.config.monitorDom?.addEventListener('click', clickHandler)
    }
  }

  private async handleMouseUp(e: MouseEvent | TouchEvent) {
    this.monitor.clearMouseListenerTry()

    setTimeout(() => {
      if (this.modal.isPanelExist(this.config.containerDom!)) {
        return
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

      const markInfoItem = this.manager.getMarkItemInfos().find(infoItem => this.manager.checkMarkSourceIsSame(infoItem.source, source))
      if (markInfoItem) {
        this.manager.updateCurrentMarkItemInfo(markInfoItem)
        this.manager.showPanel()
        return
      }

      const currentMark = this.manager.currentMarkItemInfo
      if (currentMark?.id === '' && this.manager.checkMarkSourceIsSame(currentMark.source, source)) return

      this.manager.updateCurrentMarkItemInfo({ id: '', source, comments: [], stroke: [], approx, type: MarkType.REPLY })
      this.manager.clearSelectContent()

      list.forEach(item => {
        const lastContent = this.manager.selectContent[this.manager.selectContent.length - 1]
        const newContent = {
          type: item.type,
          text: item.type === 'text' ? item.text : '',
          src: item.type === 'image' ? item.src : ''
        }
        newContent.text = newContent.text.replaceAll('\n', '')
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
          const currentInfo = this.manager.currentMarkItemInfo
          if (!currentInfo) return

          if (type === MenuType.Stroke) {
            currentInfo.id = getUUID()
            this.manager.strokeSelection({ info: currentInfo })
          } else if (type === MenuType.Copy) {
            this.manager.copyMarkedText(source, event)
          } else if (type === MenuType.Comment) {
            currentInfo.id = getUUID()
            this.manager.showPanel({ fallbackYOffset: menusY })
          } else if (type === MenuType.Chatbot && this.config.postQuoteDataHandler) {
            const quote: QuoteData = { source: {}, data: this.manager.createQuote(currentInfo.source) }
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

            this.config.postQuoteDataHandler(quote)
            this.findQuote(quote)
          }

          if (type !== MenuType.Comment) this.clearSelection()
        },
        positionCallback: ({ y }) => (menusY = y),
        noActionCallback: () => {
          this.manager.updateCurrentMarkItemInfo(null)
          this.manager.clearSelectContent()
        }
      })
    }, 0)
  }

  private getMarkPathItems(infos: SelectTextInfo[]): MarkPathItem[] | null {
    const markItems: MarkPathItem[] = []
    const ele = !this.config.iframe ? this.config.monitorDom?.querySelector('.html-text') : null
    for (const info of infos) {
      if (info.type === 'text') {
        const selector = getElementFullSelector(info.node!.parentElement!, ['slax-mark'], ele!) // 假设存在此方法
        const baseElement = this.config.monitorDom?.querySelector(selector) as HTMLElement
        if (!baseElement) return null

        const nodes = this.renderer.getAllTextNodes(baseElement)
        const nodeLengths = nodes.map(node => (node.textContent || '').length)
        const nodeIndex = nodes.indexOf(info.node as Node)
        if (nodeIndex === -1) continue

        const base = nodeLengths.slice(0, nodeIndex).reduce((acc, cur) => acc + cur, 0)
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

  private clearSelection() {
    const selection = this.getSelection()
    if (selection) selection.removeAllRanges()
    this.manager.updateCurrentMarkItemInfo(null)
    this.manager.clearSelectContent()
  }

  private getSelection() {
    return this.window.getSelection()
  }

  get isMonitoring() {
    return this.monitor.isMonitoring
  }
}
