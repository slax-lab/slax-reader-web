import { getElementFullSelector, removeOuterTag } from '@commons/utils/dom'

import type { QuoteData } from '../Chat/type'
import { Base } from './base'
import { MarkManager } from './manager'
import { MarkModal } from './modal'
import { SelectionMonitor } from './monitor'
import { MarkRenderer } from './renderer'
import { getUUID } from './tools'
import { MenuType, type SelectionConfig, type SelectTextInfo, type StrokeSelectionMeta } from './type'
import { type MarkDetail, type MarkPathApprox, type MarkPathItem, type UserInfo } from '@commons/types/interface'

export class ArticleSelection extends Base {
  private monitor: SelectionMonitor
  private manager: MarkManager
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
    const slaxMarks = Array.from(this.document.querySelectorAll(`slax-mark`))
    slaxMarks.forEach(mark => mark.classList.remove('highlighted'))

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

  updateUserInfo(userInfo: UserInfo) {
    this.config.userInfo = userInfo
  }

  async strokeSelection(info: StrokeSelectionMeta) {
    return await this.manager.strokeSelection(info)
  }

  async deleteComment(id: string, markId: number) {
    await this.manager.deleteComment(id, markId)
  }

  createQuote(items: MarkPathItem[], approx?: MarkPathApprox): QuoteData['data'] {
    return this.manager.createQuote(items, approx)
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
        if (e.target instanceof HTMLElement && e.target?.nodeName !== 'SLAX-MARK') {
          // 新需求下，slax-mark的点击是需要保留currentMarkItemInfo的
          this.manager.updateCurrentMarkItemInfo(null)
        }

        return
      }

      const source = this.manager.getMarkPathItems(list)
      if (!source) return

      const markInfoItem = this.manager.markItemInfos.value.find(infoItem => this.manager.checkMarkSourceIsSame(infoItem.source, source))
      if (markInfoItem) {
        this.manager.updateCurrentMarkItemInfo(markInfoItem)
        const currentMarkInfo = this.manager.currentMarkItemInfo.value
        if (currentMarkInfo?.comments && currentMarkInfo?.comments.length > 0) {
          this.config.markCommentSelectHandler?.(currentMarkInfo?.comments[0])
          return
        }
        // this.manager.showPanel()
        // return
      } else {
        const currentMark = this.manager.currentMarkItemInfo.value
        if (currentMark?.id === '' && this.manager.checkMarkSourceIsSame(currentMark.source, source)) return

        this.manager.updateCurrentMarkItemInfo({ id: '', source, comments: [], stroke: [], approx })
        this.manager.clearSelectContent()
      }

      list.forEach(item => {
        const lastContent = this.manager.selectContent.value[this.manager.selectContent.value.length - 1]
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

      this.manager.showMenus(e)
    }, 0)
  }

  get isMonitoring() {
    return this.monitor.isMonitoring
  }

  get markItemInfos() {
    return this.manager.markItemInfos
  }

  get currentMarkItemInfo() {
    return this.manager.currentMarkItemInfo
  }

  get selectContent() {
    return this.manager.selectContent
  }
}
