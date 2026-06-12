import type { IHttpClient } from '@slax-reader/selection/adapters'
import type { InjectionKey, MaybeRefOrGetter } from 'vue'

/**
 * BookmarkArticle 的「行为依赖」注入契约。
 *
 * 设计规约：行为 → inject；数据/视图 → props（默认值 = 现状）。
 * 默认不 provide（inject 取默认空对象）时，所有字段回退到现状行为，
 * 因此既有的上游消费页面（/bookmarks/[id]、/s/[id]、/c）行为零变化。
 * 仅 fork 的 local-first wrapper 会 provide 本对象以覆写这些行为。
 */
export interface ArticleSelectionAdapters {
  /** 覆盖默认 DwebHttpClient；factory 形式，仅在客户端 selection 初始化时调用，避免 SSR setup 期构造浏览器依赖 */
  httpClient?: () => IHttpClient
  /** 强制放开标注/标签权限；local-first 离线下恒 true。空 = 用 detail 推导的 allowAction/allowTagged */
  allowActionOverride?: boolean
  /** 覆盖 ownerUserId 解析；响应式入参，解决 userInfo 晚于 setup 到达的问题（仅在 selection 初始化「时刻」生效，初始化后不再更新既有实例） */
  ownerUserId?: MaybeRefOrGetter<number | undefined>
  /** marks 来源策略：'detail'(默认 = 现状) | 'props'(local-first)。因四类 detail 都有 marks，'marks' in detail 恒真，必须显式声明 */
  markSource?: 'detail' | 'props'
  /**
   * 本地标签存储 uuid：仅 local-first 激活时由 wrapper 下发，inner 组件透传给 BookmarkTags 触发本地标签库（PowerSync）。
   * 非 LF / 上游页面为空 → BookmarkTags 走 REST / props.tags（与现状一致），不会误把访客带入空的本地标签查询。
   */
  tagsBookmarkUuid?: string
}

// Symbol 而非字符串 key —— 类型安全、不会静默撞名
export const ArticleSelectionAdaptersKey: InjectionKey<ArticleSelectionAdapters> = Symbol('ArticleSelectionAdapters')
