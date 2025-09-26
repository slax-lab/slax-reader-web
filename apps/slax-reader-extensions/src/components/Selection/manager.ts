import { getElementFullSelector } from '@commons/utils/dom'
import { HighlightRange, type HighlightRangeInfo } from '@commons/utils/range'

import type { QuoteData } from '../Chat/type'
import Toast, { ToastType } from '../Toast'
import { Base } from './base'
import { MarkModal } from './modal'
import { MarkRenderer } from './renderer'
import { copyText, getUUID, objectDeepEqual, t } from './tools'
import { type MarkCommentInfo, type MarkItemInfo, MenuType, type SelectionConfig, type SelectTextInfo, type StrokeSelectionMeta } from './type'
import { RESTMethodPath } from '@commons/types/const'
import {
  type MarkDetail,
  type MarkInfo,
  type MarkPathApprox,
  type MarkPathItem,
  type MarkSelectContent,
  MarkType,
  type MarkUserInfo,
  type UserList
} from '@commons/types/interface'

export class MarkManager extends Base {
  private _markItemInfos = ref<MarkItemInfo[]>([])
  private _currentMarkItemInfo = ref<MarkItemInfo | null>(null)
  private _selectContent = ref<MarkSelectContent[]>([])
  private _findQuote: (quote: QuoteData) => void
  private _highlightRange: HighlightRange

  constructor(
    config: SelectionConfig,
    private renderer: MarkRenderer,
    private modal: MarkModal,
    findQuote: (quote: QuoteData) => void
  ) {
    super(config)
    this.renderer.setMarkClickHandler(this.handleMarkClick.bind(this))
    this._findQuote = findQuote
    this._highlightRange = new HighlightRange(this.document)
  }

  async drawMarks(marks: MarkDetail) {
    const userMap = this.createUserMap(marks.user_list)
    const commentMap = this.buildCommentMap(marks.mark_list, userMap)
    this.buildCommentRelationships(marks.mark_list, commentMap)
    this._markItemInfos.value = this.generateMarkItemInfos(marks.mark_list, commentMap)
    for (const info of this._markItemInfos.value) {
      await this.renderer.drawMark(info)
    }
  }

  async strokeSelection(meta: StrokeSelectionMeta) {
    const { info, comment, replyToId } = meta

    const approx = info.approx
    const markItems = info.source
    const userInfo = this.config.userInfo
    if (!userInfo) return

    if (info.stroke.find(item => item.userId === userInfo?.userId) && !comment) {
      return info.id
    }

    const infoItem = info
    const replyToComment = replyToId && replyToId !== 0 ? this.findCommentById(replyToId, infoItem) : null
    const commentItem: MarkCommentInfo | null = comment
      ? {
          markId: 0,
          comment,
          userId: userInfo?.userId || 0,
          username: userInfo?.name || '',
          avatar: userInfo?.picture || '',
          isDeleted: false,
          rootId: 0,
          reply: replyToId
            ? {
                id: replyToId,
                username: replyToComment?.username || '',
                userId: replyToComment?.userId || 0,
                avatar: replyToComment?.avatar || ''
              }
            : undefined,
          createdAt: new Date(),
          children: [],
          showInput: false,
          loading: true,
          operateLoading: false
        }
      : null

    const isUpdate = !!this._markItemInfos.value.find(item => item.id === infoItem.id)
    if (!isUpdate) this._markItemInfos.value.push(infoItem)

    if (commentItem) {
      if (replyToId) {
        const rootComment = infoItem.comments.find(item => item.markId === replyToId || item.children.some(child => child.markId === replyToId))
        if (rootComment) rootComment.children.push(commentItem)
      } else {
        infoItem.comments.push(commentItem)
      }
    } else {
      infoItem.stroke.push({ mark_id: 0, userId: userInfo?.userId || 0 })
    }

    const getType = (type: 'comment' | 'reply' | 'line') => {
      if (type === 'comment') {
        return MarkType.ORIGIN_COMMENT
      } else if (type === 'reply') {
        return MarkType.REPLY
      } else {
        return MarkType.ORIGIN_LINE
      }
    }

    const markType = commentItem ? (replyToId ? getType('reply') : getType('comment')) : getType('line')
    await this.renderer.drawMark(infoItem, isUpdate ? 'update' : 'create')

    const res = await this.saveMarkSelectContent(markItems, markType, approx, comment, replyToId)
    if (!res) {
      Toast.showToast({
        text: commentItem ? t('component.article_selection.comment_failed') : t('component.article_selection.stroke_failed'),
        type: ToastType.Error
      })

      if (commentItem) {
        if (replyToId) {
          const rootComment = infoItem.comments.find(item => item.markId === replyToId || item.children.some(child => child.markId === replyToId))
          if (rootComment) {
            const index = rootComment.children.findIndex(item => objectDeepEqual(item, commentItem))
            if (index !== -1) rootComment.children.splice(index, 1)
          }
        } else {
          const index = infoItem.comments.findIndex(item => objectDeepEqual(item, commentItem))
          if (index !== -1) infoItem.comments.splice(index, 1)
        }
      } else {
        infoItem.stroke = infoItem.stroke.filter(item => item.mark_id !== 0)
      }
      await this.renderer.drawMark(infoItem, 'update')
      return
    }

    if (commentItem) {
      commentItem.loading = false
      commentItem.markId = res.mark_id
      commentItem.rootId = res.root_id
      infoItem.comments = [...infoItem.comments]
    } else {
      infoItem.stroke = [...infoItem.stroke.filter(item => item.userId !== userInfo?.userId && !!item.mark_id), { mark_id: res.mark_id, userId: userInfo?.userId || 0 }]
    }
    await this.renderer.drawMark(infoItem, 'update')
    return infoItem.id
  }

  async deleteStroke(info: MarkItemInfo) {
    const userId = this.config.userInfo?.userId
    if (!userId) return

    const markId = info.stroke.find(item => item.userId === userId)?.mark_id
    if (!markId) return

    const bookmarkId = await this.config.bookmarkIdQuery()
    request.post({
      url: RESTMethodPath.DELETE_MARK,
      body: { bm_id: bookmarkId, mark_id: markId }
    })

    info.stroke = info.stroke.filter(item => item.userId !== userId)
    if (info.stroke.length === 0 && info.comments.length === 0) {
      const index = this._markItemInfos.value.findIndex(item => item.id === info.id)
      this._markItemInfos.value.splice(index, 1)
    }
    await this.renderer.drawMark(info, 'update')
    await this.modal.dismissPanel()
  }

  async deleteComment(id: string, markId: number) {
    const markInfoItem = id === this._currentMarkItemInfo.value?.id ? this._currentMarkItemInfo.value : this._markItemInfos.value.find(item => item.id === id)
    if (!markInfoItem || !markInfoItem.comments) return

    const removeMarkOrComment = async () => {
      for (const [idx, comment] of markInfoItem.comments.entries()) {
        if (comment.markId === markId) {
          const keepMarks = !!comment.children.find(item => !item.isDeleted)
          if (keepMarks) {
            markInfoItem.comments[idx].isDeleted = true
          } else {
            markInfoItem.comments.splice(idx, 1)
          }

          break
        }

        for (const child of comment.children) {
          if (child.markId === markId) {
            child.isDeleted = true
            break
          }
        }
      }

      await this.renderer.drawMark(markInfoItem, 'update')

      if (markInfoItem.stroke.length === 0 && markInfoItem.comments.length === 0) {
        const index = this._markItemInfos.value.findIndex(item => item.id === markInfoItem.id)
        this._markItemInfos.value.splice(index, 1)
      }
    }

    try {
      const bookmarkId = await this.config.bookmarkIdQuery()

      await request.post({
        url: RESTMethodPath.DELETE_MARK,
        body: { bm_id: bookmarkId, mark_id: markId }
      })

      await removeMarkOrComment()
    } catch (e) {
      console.error(e)
    }
  }

  async copyMarkedText(infos: { source?: MarkPathItem[]; approx?: MarkPathApprox; event?: MouseEvent }) {
    const { source, approx } = infos
    const texts: string[] = []

    if (approx) {
      texts.push(approx.exact)
    } else if (source && source.length > 0) {
      let lastNode: Node | null = null
      for (const markItem of source) {
        const infos = this.renderer.transferNodeInfos(markItem)
        for (const info of infos) {
          if (info.type === 'image') continue
          const range = this.document.createRange()
          range.setStart(info.node, info.start)
          range.setEnd(info.node, info.end)

          if (
            lastNode &&
            lastNode.parentElement?.nextElementSibling !== info.node.parentElement &&
            lastNode.parentElement?.parentElement?.nextElementSibling !== info.node.parentElement
          ) {
            texts.push('\n')
          }
          texts.push(range.toString())
          if (lastNode !== info.node) lastNode = info.node
        }
      }
    }

    const text = texts.join('')
    copyText(text)

    Toast.showToast({ text: t('common.tips.copy_content_success'), type: ToastType.Success })
  }

  checkMarkSourceIsSame(mark1: MarkPathItem[], mark2: MarkPathItem[]) {
    if (mark1.length !== mark2.length) return false

    for (let i = 0; i < mark1.length; i++) {
      const mark1Item = mark1[i]
      const mark2Item = mark2[i]
      if (mark1Item.type !== mark2Item.type) return false

      if (mark1Item.type === 'text' && mark2Item.type === 'text') {
        if (mark1Item.path !== mark2Item.path || mark1Item.start !== mark2Item.start || mark1Item.end !== mark2Item.end) {
          return false
        }
      } else if (mark1Item.type === 'image' && mark2Item.type === 'image') {
        if (mark1Item.path !== mark2Item.path && mark1Item.path.replace(/(\s*>\s*|)\s*img\s*$/, '') !== mark2Item.path.replace(/(\s*>\s*|)\s*img\s*$/, '')) {
          const ele1 = this.config.monitorDom?.querySelector(mark1Item.path) as HTMLImageElement
          const ele2 = this.config.monitorDom?.querySelector(mark2Item.path) as HTMLImageElement
          if (ele1 !== ele2) return false
        }
      }
    }

    return true
  }

  showMenus(event: MouseEvent | TouchEvent) {
    const userInfo = this.config.userInfo
    if (!userInfo) return

    let menusY = 0
    this.modal.showMenus({
      event,
      isStroked: !!this._currentMarkItemInfo.value?.stroke.find(item => item.userId === userInfo.userId),
      callback: (type: MenuType, event: MouseEvent) => {
        const currentInfo = this._currentMarkItemInfo.value
        if (!currentInfo) return

        if (type === MenuType.Stroke) {
          if (currentInfo.id.length === 0) {
            currentInfo.id = getUUID()
          }

          this.strokeSelection({ info: currentInfo })
        } else if (type === MenuType.Stroke_Delete) {
          this.deleteStroke(currentInfo)
        } else if (type === MenuType.Copy) {
          this.copyMarkedText({ source: currentInfo.source, approx: currentInfo.approx, event })
        } else if (type === MenuType.Comment) {
          if (currentInfo.id.length === 0) {
            currentInfo.id = getUUID()
          }

          this.config.menusCommentHandler?.(currentInfo, this.createQuote(currentInfo.source, currentInfo.approx))
          // this.showPanel({ fallbackYOffset: menusY })
        } else if (type === MenuType.Chatbot && this.config.postQuoteDataHandler) {
          const quote: QuoteData = { source: {}, data: this.createQuote(currentInfo.source, currentInfo.approx) }
          const selection = this.getSelection()
          const range = selection?.rangeCount ? selection.getRangeAt(0) : undefined
          const selected = this.getElementsList(range!)

          if (!selected || selected.length === 0) {
            quote.source.selection = range
          } else {
            const paths = this.getMarkPathItems(selected)
            quote.source.paths = paths || (range ? undefined : [])
            if (!paths && range) quote.source.selection = range
          }

          this.config.postQuoteDataHandler(quote)
          this._findQuote(quote)
        }

        if (type !== MenuType.Comment) this.clearSelection()
      },
      positionCallback: ({ y }) => (menusY = y),
      noActionCallback: () => {
        this.updateCurrentMarkItemInfo(null)
        this.clearSelectContent()
      }
    })
  }

  showPanel(options?: { fallbackYOffset: number }) {
    if (!this._currentMarkItemInfo.value) return

    const userInfo = this.config.userInfo
    if (!userInfo) return

    const currentMarkItemInfo = this._currentMarkItemInfo.value
    this.modal.showPanel({
      info: this._currentMarkItemInfo.value,
      fallbackYOffset: options?.fallbackYOffset || 0,
      actionCallback: (type, meta) => {
        if (type === MenuType.Stroke) this.strokeSelection(meta as StrokeSelectionMeta)
        else if (type === MenuType.Stroke_Delete) this.deleteStroke(meta.info)
        else if (type === MenuType.Copy) this.copyMarkedText({ source: meta.info.source, approx: meta.info.approx, event: meta.event })
        else if (type === MenuType.Comment) this.strokeSelection(meta as StrokeSelectionMeta)
        else if (type === MenuType.Chatbot && this.config.postQuoteDataHandler) {
          const quote = { source: { id: meta.info.id }, data: this.createQuote(meta.info.source, meta.info.approx) }
          this.config.postQuoteDataHandler(quote)
          this._findQuote(quote)
        }
      },
      commentDeleteCallback: (id, markId) => this.deleteComment(id, markId),
      dismissCallback: () => {
        if (this._currentMarkItemInfo.value === currentMarkItemInfo) {
          this.updateCurrentMarkItemInfo(null)
          this.clearSelectContent()
        }
      }
    })
  }

  createQuote(items: MarkPathItem[], approx?: MarkPathApprox): QuoteData['data'] {
    return items.map(item => {
      if (item.type === 'image') {
        const infos = this.renderer.transferNodeInfos(item)
        const content = infos.length > 0 && infos[0].type === 'image' ? (infos[0].ele as HTMLImageElement).src : ''
        return { type: 'image', content }
      }

      const infos = this.renderer.transferNodeInfos(item)

      if (infos.length > 0) {
        const text = infos
          .map(info => {
            if (info.type === 'image') return ''
            const range = this.document.createRange()
            range.setStart(info.node, info.start)
            range.setEnd(info.node, info.end)
            return range.toString()
          })
          .join('')
        return { type: 'text', content: text }
      } else if (approx) {
        const rangeSvc = new HighlightRange(this.window.document)
        const range = rangeSvc.getRange(approx)
        return { type: 'text', content: range?.toString() || '' }
      }

      return { type: 'text', content: '' }
    })
  }

  getElementInfo(range: Range): { list: SelectTextInfo[]; approx: HighlightRangeInfo | undefined } {
    const list = this.getElementsList(range)
    const approx = this.getApproxText(range)

    return {
      list,
      approx
    }
  }

  getApproxText(range: Range): HighlightRangeInfo | undefined {
    if (!range) {
      return undefined
    }

    const approx = this._highlightRange.getSelector(range)
    return approx
  }

  getElementsList(range: Range): SelectTextInfo[] {
    if (!range) {
      return []
    }

    const selectedInfo: SelectTextInfo[] = []

    const isNodeFullyInRange = (node: Node) => {
      const nodeRange = this.document.createRange()
      nodeRange.selectNodeContents(node)
      return range.compareBoundaryPoints(Range.START_TO_START, nodeRange) <= 0 && range.compareBoundaryPoints(Range.END_TO_END, nodeRange) >= 0
    }

    const isNodePartiallyInRange = (node: Node) => range.intersectsNode(node)

    const processTextNode = (textNode: Text) => {
      if (!isNodePartiallyInRange(textNode)) return

      let startOffset = textNode === range.startContainer ? range.startOffset : 0
      let endOffset = textNode === range.endContainer ? range.endOffset : textNode.length
      startOffset = Math.max(0, Math.min(startOffset, textNode.length))
      endOffset = Math.max(startOffset, Math.min(endOffset, textNode.length))

      if (endOffset > startOffset) {
        selectedInfo.push({
          type: 'text',
          node: textNode,
          startOffset,
          endOffset,
          text: textNode.textContent!.slice(startOffset, endOffset)
        })
      }
    }

    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && (node.textContent?.trim() || '').length > 0) {
        processTextNode(node as Text)
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement
        if (element.tagName === 'IMG' && isNodeFullyInRange(element)) {
          selectedInfo.push({ type: 'image', src: (element as HTMLImageElement).src, ele: element })
        }
        if (isNodePartiallyInRange(element)) {
          for (const child of element.childNodes) processNode(child)
        }
      }
    }

    processNode(range.commonAncestorContainer)
    return selectedInfo.length > 0 && !selectedInfo.every(item => item.type === 'text' && item.text.trim().length === 0) ? selectedInfo : []
  }

  updateCurrentMarkItemInfo(info: MarkItemInfo | null) {
    this._currentMarkItemInfo.value = info
  }

  pushSelectContent(content: MarkSelectContent) {
    this._selectContent.value.push(content)
  }

  clearSelectContent() {
    this._selectContent.value = []
  }

  getMarkPathItems(infos: SelectTextInfo[]): MarkPathItem[] | null {
    const markItems: MarkPathItem[] = []
    const ele = this.config.monitorDom?.querySelector('.html-text')
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

  private async saveMarkSelectContent(value: MarkPathItem[], type: MarkType, approx: MarkPathApprox, comment?: string, replyToId?: number) {
    const bookmarkId = await this.config.bookmarkIdQuery()
    try {
      const res = await request.post<{ mark_id: number; root_id: number }>({
        url: RESTMethodPath.ADD_MARK,
        body: {
          bm_id: bookmarkId,
          comment,
          type,
          source: value,
          parent_id: replyToId,
          select_content: this._selectContent.value,
          approx_source: approx
        }
      })
      return res || null
    } catch (error) {
      console.log(error)
      return null
    }
  }

  private createUserMap(userList: UserList): Map<number, MarkUserInfo> {
    return new Map(Object.entries(userList).map(([key, value]) => [Number(key), value]))
  }

  private buildCommentMap(markList: MarkInfo[], userMap: Map<number, MarkUserInfo>): Map<number, MarkCommentInfo> {
    const commentMap = new Map<number, MarkCommentInfo>()
    for (const mark of markList) {
      if ([MarkType.COMMENT, MarkType.REPLY, MarkType.ORIGIN_COMMENT].includes(mark.type)) {
        const comment = {
          markId: mark.id,
          comment: mark.comment,
          userId: mark.user_id,
          username: userMap.get(mark.user_id)?.username || '',
          avatar: userMap.get(mark.user_id)?.avatar || '',
          isDeleted: mark.is_deleted,
          children: [],
          createdAt: new Date(mark.created_at),
          rootId: mark.root_id,
          showInput: false,
          loading: false,
          operateLoading: false
        }

        commentMap.set(mark.id, comment)
      }
    }
    return commentMap
  }

  private buildCommentRelationships(markList: MarkInfo[], commentMap: Map<number, MarkCommentInfo>) {
    for (const mark of markList) {
      if (mark.type !== MarkType.REPLY) continue
      if (!commentMap.has(mark.id) || !commentMap.has(mark.parent_id) || !commentMap.has(mark.root_id)) continue

      const comment = commentMap.get(mark.id)!
      const parentComment = commentMap.get(mark.parent_id)!
      comment.reply = {
        id: parentComment.markId,
        username: parentComment.username,
        userId: parentComment.userId,
        avatar: parentComment.avatar
      }
      const rootComment = commentMap.get(comment.rootId!)
      if (rootComment) rootComment.children.push(comment)
    }
  }

  private generateMarkItemInfos(markList: MarkInfo[], commentMap: Map<number, MarkCommentInfo>): MarkItemInfo[] {
    const infoItems: MarkItemInfo[] = []
    for (const mark of markList) {
      const userId = mark.user_id
      const source = mark.source
      if (typeof source === 'number' || mark.type === MarkType.REPLY) continue
      if (!mark.approx_source || Object.keys(mark.approx_source).length === 0) continue // 插件划线针对旧版本划线直接过滤

      const markSources = source as MarkPathItem[]
      let markInfoItem = infoItems.find(infoItem => this.checkMarkSourceIsSame(infoItem.source, markSources))

      if (!markInfoItem) {
        markInfoItem = { id: getUUID(), source: markSources, comments: [], stroke: [], approx: mark.approx_source }
        infoItems.push(markInfoItem)
      }

      if ([MarkType.LINE, MarkType.ORIGIN_LINE].includes(mark.type)) {
        markInfoItem.stroke.push({ mark_id: mark.id, userId })
      } else if ([MarkType.COMMENT, MarkType.ORIGIN_COMMENT].includes(mark.type)) {
        const comment = commentMap.get(mark.id)
        if (!comment || (comment.isDeleted && comment.children.length === 0)) {
          continue
        }

        markInfoItem.comments.push(comment)
      }
    }

    return infoItems
  }

  private findCommentById(targetId: number, infoItem: MarkItemInfo): MarkCommentInfo | null {
    for (const item of infoItem.comments) {
      if (item.markId === targetId) return item
      for (const child of item.children) {
        if (child.markId === targetId) return child
      }
    }
    return null
  }

  private handleMarkClick(ele: HTMLElement, event: PointerEvent) {
    const id = ele.dataset.uuid
    if (!id) return

    const infoItem = this._markItemInfos.value.find(item => item.id === id)
    if (!infoItem) return

    if ((!infoItem.approx || Object.keys(infoItem.approx).length === 0) && infoItem.source.length > 0) {
      // 这里兼容无approx的数据

      try {
        const walker = this.document.createTreeWalker(ele, NodeFilter.SHOW_TEXT)

        let firstTextNode: Text | null = null
        let lastTextNode: Text | null = null
        while (walker.nextNode()) {
          const node = walker.currentNode as Text
          if (!firstTextNode) firstTextNode = node
          lastTextNode = node
        }

        if (firstTextNode && lastTextNode) {
          const range = this.document.createRange()
          range.setStart(firstTextNode, 0)
          range.setEnd(lastTextNode, lastTextNode.length)

          infoItem.approx = this.getApproxText(range)!
        }
      } catch (error) {
        console.error(error)
      }
    }

    this._currentMarkItemInfo.value = infoItem
    // this.showPanel()
    if (this._currentMarkItemInfo.value.comments.length > 0) {
      this.config.markCommentSelectHandler?.(this._currentMarkItemInfo.value.comments[0])
    }

    this.showMenus(event)
  }

  private clearSelection() {
    const selection = this.getSelection()
    if (selection) selection.removeAllRanges()
    this.updateCurrentMarkItemInfo(null)
    this.clearSelectContent()
  }

  get markItemInfos() {
    return this._markItemInfos
  }

  get currentMarkItemInfo() {
    return this._currentMarkItemInfo
  }

  get selectContent() {
    return this._selectContent
  }
}
