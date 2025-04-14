import type { QuoteData } from '../Chat/type'
import Toast, { ToastType } from '../Toast'
import SelectionModal from './modal'
import { MarkRenderer } from './renderer'
import { copyText, getUUID, objectDeepEqual, t } from './tools'
import { type MarkCommentInfo, type MarkItemInfo, MenuType, type SelectionConfig, type StrokeSelectionMeta } from './type'
import { RESTMethodPath } from '@commons/types/const'
import { type MarkDetail, type MarkInfo, type MarkPathItem, type MarkSelectContent, MarkType, type MarkUserInfo, type UserList } from '@commons/types/interface'

export class MarkManager {
  private _markItemInfos: MarkItemInfo[] = []
  private _currentMarkItemInfo = ref<MarkItemInfo | null>(null)
  private _selectContent = ref<MarkSelectContent[]>([])
  private _findQuote: (quote: QuoteData) => void

  constructor(
    private config: SelectionConfig,
    private renderer: MarkRenderer,
    findQuote: (quote: QuoteData) => void
  ) {
    this.renderer.setMarkClickHandler(this.handleMarkClick.bind(this))
    this._findQuote = findQuote
  }

  async drawMarks(marks: MarkDetail) {
    const userMap = this.createUserMap(marks.user_list)
    const commentMap = this.buildCommentMap(marks.mark_list, userMap)
    this.buildCommentRelationships(marks.mark_list, commentMap)
    this._markItemInfos = this.generateMarkItemInfos(marks.mark_list, commentMap)
    await this.renderAllMarks()
  }

  async strokeSelection(meta: StrokeSelectionMeta) {
    const { info, comment, replyToId } = meta
    const markItems = info.source

    const userInfo = await this.config.userInfo
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
          loading: true
        }
      : null

    const isUpdate = !replyToId && !!this._markItemInfos.find(item => item.id === infoItem.id)
    if (!isUpdate) this._markItemInfos.push(infoItem)

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

    const markType = commentItem ? (replyToId ? MarkType.REPLY : MarkType.COMMENT) : MarkType.LINE
    await this.renderer.drawMark(infoItem, isUpdate ? 'update' : 'create')

    const res = await this.saveMarkSelectContent(markItems, markType, comment, replyToId)
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
    const userInfo = await this.config.userInfo
    if (!userInfo) return

    const userId = userInfo.userId
    if (!userId) return

    const markId = info.stroke.find(item => item.userId === userId)?.mark_id
    if (!markId) return

    const bookmarkId = await this.config.bookmarkIdQuery()
    await request.post({
      url: RESTMethodPath.DELETE_MARK,
      body: { bm_id: bookmarkId, mark_id: markId }
    })

    info.stroke = info.stroke.filter(item => item.userId !== userId)
    if (info.stroke.length === 0 && info.comments.length === 0) {
      const index = this._markItemInfos.findIndex(item => item.id === info.id)
      this._markItemInfos.splice(index, 1)
    }
    await this.renderer.drawMark(info, 'update')
  }

  async deleteComment(id: string, markId: number) {
    const markInfoItem = id === this._currentMarkItemInfo.value?.id ? this._currentMarkItemInfo.value : this._markItemInfos.find(item => item.id === id)
    if (!markInfoItem || !markInfoItem.comments) return

    const removeMarkOrComment = () => {
      for (const [idx, comment] of markInfoItem.comments.entries()) {
        if (comment.markId === markId) {
          const keepMarks = !!comment.children.find(item => !item.isDeleted)
          if (keepMarks) {
            markInfoItem.comments[idx].isDeleted = true
          } else {
            markInfoItem.comments.splice(idx, 1)
            const index = this._markItemInfos.findIndex(item => item.id === id)
            this._markItemInfos.splice(index, 1)
          }
          return
        }
        for (const child of comment.children) {
          if (child.markId === markId) {
            child.isDeleted = true
            return
          }
        }
      }
    }

    try {
      const bookmarkId = await this.config.bookmarkIdQuery()

      await request.post({
        url: RESTMethodPath.DELETE_MARK,
        body: { bm_id: bookmarkId, mark_id: markId }
      })
      removeMarkOrComment()
    } catch (e) {
      console.error(e)
    }
  }

  async copyMarkedText(markItems: MarkPathItem[], event?: MouseEvent) {
    const texts: string[] = []
    let lastNode: Node | null = null
    for (const markItem of markItems) {
      const infos = this.renderer.transferNodeInfos(markItem)
      for (const info of infos) {
        if (info.type === 'image') continue
        const range = document.createRange()
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

  showPanel(options?: { fallbackYOffset: number }) {
    if (!this._currentMarkItemInfo.value) return

    const userInfo = this.config.userInfo
    if (!userInfo) return

    SelectionModal.showPanel({
      container: this.config.containerDom!,
      articleDom: this.config.monitorDom!,
      info: this._currentMarkItemInfo.value,
      userId: userInfo.userId,
      allowAction: this.config.allowAction,
      fallbackYOffset: options?.fallbackYOffset || 0,
      actionCallback: (type, meta) => {
        if (type === MenuType.Stroke) this.strokeSelection(meta)
        else if (type === MenuType.Stroke_Delete) this.deleteStroke(meta.info)
        else if (type === MenuType.Copy) this.copyMarkedText(meta.info.source, meta.event)
        else if (type === MenuType.Comment) this.strokeSelection(meta)
        else if (type === MenuType.Chatbot && this.config.postQuoteDataHandler) {
          const quote = { source: { id: meta.info.id }, data: this.createQuote(meta.info.source) }
          this.config.postQuoteDataHandler(quote)
          this._findQuote(quote)
        }
      },
      commentDeleteCallback: (id, markId) => this.deleteComment(id, markId),
      dismissCallback: () => {
        this._currentMarkItemInfo.value = null
        this._selectContent.value = []
      }
    })
  }

  createQuote(items: MarkPathItem[]): QuoteData['data'] {
    return items.map(item => {
      if (item.type === 'image') {
        const infos = this.renderer.transferNodeInfos(item)
        const content = infos.length > 0 && infos[0].type === 'image' ? (infos[0].ele as HTMLImageElement).src : ''
        return { type: 'image', content }
      }
      const infos = this.renderer.transferNodeInfos(item)
      const text = infos
        .map(info => {
          if (info.type === 'image') return ''
          const range = document.createRange()
          range.setStart(info.node, info.start)
          range.setEnd(info.node, info.end)
          return range.toString()
        })
        .join('')
      return { type: 'text', content: text }
    })
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

  private async renderAllMarks() {
    for (const info of this._markItemInfos) {
      await this.renderer.drawMark(info)
    }
  }

  private async saveMarkSelectContent(value: MarkPathItem[], type: MarkType, comment?: string, replyToId?: number) {
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
          select_content: this._selectContent.value
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
      if (mark.type === MarkType.COMMENT || mark.type === MarkType.REPLY) {
        const comment = {
          markId: mark.id,
          comment: mark.comment,
          userId: mark.user_id,
          username: userMap.get(mark.user_id)?.username || '',
          avatar: userMap.get(mark.user_id)?.avatar || '',
          isDeleted: mark.is_deleted,
          children: mark.type === MarkType.COMMENT ? [] : [],
          createdAt: new Date(mark.created_at),
          rootId: mark.root_id,
          showInput: false,
          loading: false
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
      if (typeof source === 'number') continue

      const markSources = source as MarkPathItem[]
      let markInfoItem = infoItems.find(infoItem => this.checkMarkSourceIsSame(infoItem.source, markSources))
      if (!markInfoItem) {
        markInfoItem = { id: getUUID(), source: markSources, comments: [], stroke: [] }
        infoItems.push(markInfoItem)
      }

      if (mark.type === MarkType.LINE) {
        markInfoItem.stroke.push({ mark_id: mark.id, userId })
      } else if (mark.type === MarkType.COMMENT) {
        const comment = commentMap.get(mark.id)
        if (comment) markInfoItem.comments.push(comment)
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

  private handleMarkClick(ele: HTMLElement) {
    const id = ele.dataset.uuid
    if (!id) return

    const infoItem = this._markItemInfos.find(item => item.id === id)
    if (!infoItem) return

    this._currentMarkItemInfo.value = infoItem
    this.showPanel()
  }

  get currentMarkItemInfo() {
    return this._currentMarkItemInfo.value
  }

  get selectContent() {
    return this._selectContent.value
  }

  getMarkItemInfos() {
    return this._markItemInfos
  }
}
