/**
 * Slax Reader 埋点事件类型定义
 *
 * 数据来源：Slax Reader埋点上报_数据表.csv
 * 命名规范：{feature}_{action} 格式
 * 更新时间：2026-02-06
 */

// ==================== 基础类型定义 ====================

/**
 * 用户ID类型（未登录时可为 undefined）
 */
export type UserId = number | undefined

// ==================== 订阅相关埋点 ====================

/**
 * 访问订阅页面
 * 上报渠道：APP, Web
 */
export interface SubscriptionViewEvent {
  event: 'subscription_view'
  user_id: number
  presentation: 'dialog' | 'screen'
}

/**
 * 开始结账流程
 */
export interface SubscriptionCheckoutStartEvent {
  event: 'subscription_checkout_start'
  user_id: number
  plan_id: string
  subscription_type?: 'initial' | 'auto_renewal' | 'resubscribe'
  offer_type: 'trial_cardless' | 'trial_authorized' | 'standard'
  gateway: 'stripe' | 'apple_iap' | 'google_iap'
}

/**
 * 订阅完成
 * 上报渠道：Backend
 */
export interface SubscriptionCheckoutCompleteEvent {
  event: 'subscription_checkout_complete'
  user_id: number
  subscription_type: 'initial_subscription' | 'auto_renewal' | 'resubscription'
  offer_type: 'trial_cardless' | 'trial_authorized' | 'standard'
  gateway: 'stripe' | 'apple_iap' | 'google_iap'
}

/**
 * 结账错误
 */
export interface SubscriptionCheckoutErrorEvent {
  event: 'subscription_checkout_error'
  user_id: number
  reason: string
  error_code: string
}

/**
 * 开始取消订阅
 */
export interface SubscriptionCancelStartEvent {
  event: 'subscription_cancel_start'
  user_id: number
}

/**
 * 取消订阅完成
 */
export interface SubscriptionCancelCompleteEvent {
  event: 'subscription_cancel_complete'
  user_id: number
}

/**
 * 取消订阅错误
 */
export interface SubscriptionCancelErrorEvent {
  event: 'subscription_cancel_error'
  user_id: number
  reason: string
  error_code: string
}

// ==================== 书签相关埋点 ====================

/**
 * 打开书签详情页
 * 上报渠道：APP, Web
 */
export interface BookmarkViewEvent {
  event: 'bookmark_view'
  user_id: number
  id: number // 伪ID，用于统计阅读篇数分布
  mode: 'original' | 'snapshot'
}

/**
 * 开始添加书签
 */
export interface BookmarkAddStartEvent {
  event: 'bookmark_add_start'
  user_id: number
  channel: 'telegram' | 'browser_extension' | 'app' | 'web'
  method: 'manual_paste' | 'browser_extension' | 'share_extension'
}

/**
 * 添加书签中间步骤
 * 上报渠道：Backend
 */
export interface BookmarkAddStepEvent {
  event: 'bookmark_add_step'
  user_id: number
  step_name: 'snapshot_scrapping' | 'snapshot_parsing' | 'embedding'
  domain: string
  status: 'success' | 'failed'
  bm_uuid: string
}

/**
 * 添加书签完成
 */
export interface BookmarkAddCompleteEvent {
  event: 'bookmark_add_complete'
  user_id: number
  domain: string
  bm_uuid: string
}

/**
 * 添加书签错误
 */
export interface BookmarkAddErrorEvent {
  event: 'bookmark_add_error'
  user_id: number
  domain: string
  bm_uuid: string
}

/**
 * 归档/取消归档书签
 * 上报渠道：APP, Web, Extension
 */
export interface BookmarkArchiveEvent {
  event: 'bookmark_archive'
  user_id: number
  bookmark_id: number
  is_archived: boolean
}

/**
 * 加星/取消加星书签
 * 上报渠道：APP, Web, Extension
 */
export interface BookmarkStarEvent {
  event: 'bookmark_star'
  user_id: number
  bookmark_id: number
  is_starred: boolean
  source: 'bookmark' | 'inbox'
}

/**
 * 设置标签
 */
export interface BookmarkTagUpdateEvent {
  event: 'bookmark_tag_update'
  user_id: number
  bookmark_id: number
  sub_action: 'add' | 'remove'
}

/**
 * AI 对话交互
 * 上报渠道：Extension, Web
 */
export interface BookmarkChatInteractEvent {
  event: 'bookmark_chat_interact'
  user_id: number
  bookmark_id: number
  sub_action: 'open' | 'close' | 'expand' | 'collapse'
  entry_point: 'popup-menu' | 'sidebar-entry'
}

/**
 * Overview交互
 * 上报渠道：APP, Web, Extension
 */
export interface BookmarkOverviewInteractEvent {
  event: 'bookmark_overview_interact'
  user_id: number
  bookmark_id: number
  sub_action: 'open' | 'close' | 'expand' | 'collapse'
}

/**
 * Outline交互
 * 上报渠道：APP, Web, Extension
 */
export interface BookmarkOutlineInteractEvent {
  event: 'bookmark_outline_interact'
  user_id: number
  bookmark_id: number
  sub_action: 'open' | 'close' | 'expand' | 'collapse'
}

/**
 * 删除书签（移动到回收站）
 * 上报渠道：Web, APP
 */
export interface BookmarkDeleteEvent {
  event: 'bookmark_delete'
  user_id: number
  bookmark_id: number
}

// ==================== 反馈相关埋点 ====================

/**
 * 开始提交反馈
 * 上报渠道：APP, Extension, Web
 */
export interface FeedbackSubmitStartEvent {
  event: 'feedback_submit_start'
  user_id: number
  scope: 'bookmark' | 'app'
}

/**
 * 提交反馈完成
 * 上报渠道：Backend
 */
export interface FeedbackSubmitCompleteEvent {
  event: 'feedback_submit_complete'
  user_id: number
  scope: 'bookmark' | 'app'
}

// ==================== 用户相关埋点 ====================

/**
 * 展示登录页面
 * 上报渠道：Web
 */
export interface UserViewLoginEvent {
  event: 'user_view_login'
  referrer?: string
}

/**
 * 点击登录按钮
 * 上报渠道：Web, APP
 */
export interface UserLoginStartEvent {
  event: 'user_login_start'
  user_id?: number
  method: 'google' | 'apple'
}

/**
 * 登录完成
 * 上报渠道：Backend
 */
export interface UserLoginCompleteEvent {
  event: 'user_login_complete'
  user_id: number
  is_new_user: boolean
  referral_code?: string
}

/**
 * 登录失败
 */
export interface UserLoginErrorEvent {
  event: 'user_login_error'
  user_id?: number
  reason: string
  error_code: string
}

// ==================== 设置相关埋点 ====================

/**
 * 打开设置页面
 * 上报渠道：APP, Web
 */
export interface SettingViewEvent {
  event: 'setting_view'
  user_id: number
}

// ==================== 书签列表相关埋点 ====================

/**
 * 打开书签列表页
 * 上报渠道：APP, Web
 */
export interface BookmarkListViewEvent {
  event: 'bookmark_list_view'
  user_id: number
  section: 'inbox' | 'starred' | 'topics' | 'collections' | 'highlights' | 'archive' | 'trash' | 'notifications'
}

/**
 * 下载安装插件
 * 上报渠道：Web
 */
export interface BookmarkListDownloadEvent {
  event: 'bookmark_list_download'
  user_id: number
  client: 'browser_extension'
}

/**
 * 书签列表项交互
 * 上报渠道：Web
 */
export interface BookmarkListItemInteractEvent {
  event: 'bookmark_list_item_interact'
  user_id: number
  bookmark_id: number
  element: 'title' | 'orginal' | 'snapshot' | 'edit_title' | 'star' | 'archive' | 'trash'
  section: 'inbox' | 'starred' | 'topics' | 'collections' | 'highlights' | 'archive' | 'trash' | 'notifications'
}

/**
 * 书签列表搜索
 * 上报渠道：Web
 */
export interface BookmarkListSearchEvent {
  event: 'bookmark_list_search'
  user_id: number
  keyword: string
  result_count?: number
}

// ==================== 官网相关埋点 ====================

/**
 * 访问官网页面
 * 上报渠道：Web
 */
export interface HomepageViewEvent {
  event: 'homepage_view'
  user_id?: number
  section: 'homepage' | 'pricing' | 'download' | 'blog' | 'contact'
  referrer?: string
}

/**
 * 官网下载
 * 上报渠道：Web
 */
export interface HomepageDownloadEvent {
  event: 'homepage_download'
  user_id?: number
  client: 'ios' | 'android' | 'mac' | 'browser_extension'
}

/**
 * 领取免费试用
 * 上报渠道：Web
 */
export interface HomepageClaimFreeTrialEvent {
  event: 'homepage_claim_free_trial'
  user_id?: number
  source: 'official' | 'koc'
  referral_code?: string
}

// ==================== 联合类型 ====================

/**
 * 所有埋点事件的联合类型
 */
export type AnalyticsEvent =
  // 订阅相关
  | SubscriptionViewEvent
  | SubscriptionCheckoutStartEvent
  | SubscriptionCheckoutCompleteEvent
  | SubscriptionCheckoutErrorEvent
  | SubscriptionCancelStartEvent
  | SubscriptionCancelCompleteEvent
  | SubscriptionCancelErrorEvent
  // 书签相关
  | BookmarkViewEvent
  | BookmarkAddStartEvent
  | BookmarkAddStepEvent
  | BookmarkAddCompleteEvent
  | BookmarkAddErrorEvent
  | BookmarkArchiveEvent
  | BookmarkStarEvent
  | BookmarkTagUpdateEvent
  | BookmarkChatInteractEvent
  | BookmarkOverviewInteractEvent
  | BookmarkOutlineInteractEvent
  | BookmarkDeleteEvent
  // 反馈相关
  | FeedbackSubmitStartEvent
  | FeedbackSubmitCompleteEvent
  // 用户相关
  | UserViewLoginEvent
  | UserLoginStartEvent
  | UserLoginCompleteEvent
  | UserLoginErrorEvent
  // 设置相关
  | SettingViewEvent
  // 书签列表相关
  | BookmarkListViewEvent
  | BookmarkListDownloadEvent
  | BookmarkListItemInteractEvent
  | BookmarkListSearchEvent
  // 官网相关
  | HomepageViewEvent
  | HomepageDownloadEvent
  | HomepageClaimFreeTrialEvent

/**
 * Web 端埋点事件类型
 */
export type WebAnalyticsEvent =
  | SubscriptionViewEvent
  | BookmarkViewEvent
  | BookmarkArchiveEvent
  | BookmarkStarEvent
  | BookmarkChatInteractEvent
  | BookmarkOverviewInteractEvent
  | BookmarkOutlineInteractEvent
  | BookmarkDeleteEvent
  | FeedbackSubmitStartEvent
  | UserViewLoginEvent
  | UserLoginStartEvent
  | SettingViewEvent
  | BookmarkListViewEvent
  | BookmarkListDownloadEvent
  | BookmarkListItemInteractEvent
  | BookmarkListSearchEvent
  | HomepageViewEvent
  | HomepageDownloadEvent
  | HomepageClaimFreeTrialEvent

/**
 * Extension 端埋点事件类型
 */
export type ExtensionAnalyticsEvent =
  | BookmarkArchiveEvent
  | BookmarkStarEvent
  | BookmarkChatInteractEvent
  | BookmarkOverviewInteractEvent
  | BookmarkOutlineInteractEvent
  | FeedbackSubmitStartEvent

/**
 * APP 端埋点事件类型
 */
export type AppAnalyticsEvent =
  | SubscriptionViewEvent
  | BookmarkViewEvent
  | BookmarkArchiveEvent
  | BookmarkStarEvent
  | BookmarkOverviewInteractEvent
  | BookmarkOutlineInteractEvent
  | BookmarkDeleteEvent
  | FeedbackSubmitStartEvent
  | UserLoginStartEvent
  | SettingViewEvent
  | BookmarkListViewEvent

/**
 * Backend 端埋点事件类型
 */
export type BackendAnalyticsEvent = SubscriptionCheckoutCompleteEvent | BookmarkAddStepEvent | FeedbackSubmitCompleteEvent | UserLoginCompleteEvent

// ==================== 工具类型 ====================

/**
 * 提取事件名称类型
 */
export type AnalyticsEventName = AnalyticsEvent['event']

/**
 * 根据事件名称提取参数类型
 */
export type AnalyticsEventParams<T extends AnalyticsEventName> = Extract<AnalyticsEvent, { event: T }>

/**
 * 埋点上报函数类型
 */
export type AnalyticsTrackFn = <T extends AnalyticsEventName>(params: AnalyticsEventParams<T>) => void
