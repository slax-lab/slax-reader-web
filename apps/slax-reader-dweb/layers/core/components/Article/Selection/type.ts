import type { MarkPathApprox, MarkPathItem, MarkType } from '@commons/types/interface'
import type { QuoteData } from '#layers/core/components/Chat/type'

export enum MenuType {
  Copy = 'copy',
  Stroke = 'stroke',
  Stroke_Delete = 'stroke_delete',
  Comment = 'comment',
  Chatbot = 'chatbot'
}

export interface MarkItemInfo {
  id: string
  source: MarkPathItem[]
  stroke: { mark_id?: number; userId: number }[]
  comments: MarkCommentInfo[]
  approx?: MarkPathApprox
  type: MarkType
}

export type MarkCommentInfo = {
  markId: number
  comment: string
  userId: number
  username: string
  avatar: string
  isDeleted: boolean
  reply?: {
    username: string
    userId: number
    id: number
    avatar: string
  }
  rootId?: number
  createdAt: Date
  children: MarkCommentInfo[]
} & {
  // 针对界面相关的控制属性
  showInput: boolean
  loading: boolean
}

export interface SelectionConfig {
  containerDom: HTMLDivElement | null
  monitorDom: HTMLDivElement | null
  bookmarkId?: number
  shareCode?: string
  collection?: { code: string; cb_id: number }
  ownerUserId: number
  allowAction: boolean
  postQuoteDataHandler: (data: QuoteData) => void
}

export interface StrokeSelectionMeta {
  info: MarkItemInfo
  comment?: string
  replyToId?: number
  approx: MarkPathApprox
}

export interface DrawMarkBaseInfo {
  id: string
  isStroke: boolean
  isComment: boolean
  isSelfStroke: boolean
  isHighlighted?: boolean
}
