import type { IHttpClient } from '@slax-reader/selection/adapters'
import type { InjectionKey, MaybeRefOrGetter } from 'vue'

/**
 * BookmarkArticle「行为依赖」注入契约
 * 默认空=现状，仅 fork LF wrapper provide 覆写
 */
export interface ArticleSelectionAdapters {
  /** 覆盖 HttpClient；factory，仅客户端调用 */
  httpClient?: () => IHttpClient
  /** 强制放开权限；空=detail 推导 */
  allowActionOverride?: boolean
  /** 覆盖 ownerUserId；响应式，仅初始化时刻生效 */
  ownerUserId?: MaybeRefOrGetter<number | undefined>
  /** marks 来源：detail(默认) | props(LF)，须显式声明 */
  markSource?: 'detail' | 'props'
  /** 本地标签库 uuid：仅 LF 下发，空则走 REST/props.tags */
  tagsBookmarkUuid?: string
}

// Symbol key：类型安全，不撞名
export const ArticleSelectionAdaptersKey: InjectionKey<ArticleSelectionAdapters> = Symbol('ArticleSelectionAdapters')
