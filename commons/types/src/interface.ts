export enum BookmarkParseStatus {
  PENDING = 'pending',
  PARSEING = 'parseing',
  FAILED = 'failed',
  SUCCESS = 'success',
  UPDATING = 'updating'
}

export interface MarkDetail {
  mark_list: MarkInfo[]
  user_list: UserList
}

export type UserList = {
  [key: string]: MarkUserInfo
}

export interface MarkInfo {
  id: number
  user_id: number
  type: MarkType
  source: MarkPathItem[]
  approx_source?: MarkPathApprox
  parent_id: number
  root_id: number
  comment: string
  created_at: Date
  is_deleted: boolean
  children: MarkInfo[]
}

export interface MarkUserInfo {
  id: number
  username: string
  avatar: string
}

export type MarkPathItem =
  | {
      type: 'text'
      path: string
      start: number
      end: number
    }
  | {
      type: 'image'
      path: string
    }

export type MarkPathApprox = {
  exact: string
  prefix: string
  suffix: string
  position_start: number
  position_end: number
}

export interface ShareInfo {
  need_login: boolean
  created_at: string
  allow_action: boolean
  share_code: string
}

export interface CollectionInfo {
  allow_action: boolean
  owner_id: number
  collection_code: string
  cb_id: number
}

export interface BookmarkItem {
  id: number
  title: string
  alias_title: string
  host_url: string
  target_url: string
  content_icon: string
  content_cover: string
  content_word_count?: number
  description?: string
  byline?: string
  private_user?: number
  status: BookmarkParseStatus
  created_at?: string
  updated_at?: string
  published_at?: string
  site_name?: string
  archived: 'inbox' | 'archive' | 'later'
  starred: 'star' | 'unstar'
  trashed_at?: string | null
  type: 'shortcut' | 'article'
}

export interface InlineBookmarkDetail {
  title: string
  target_url: string
  share_info: ShareInfo
  marks: MarkDetail
  user_info: {
    nick_name: string
    avatar: string
    show_userinfo: boolean
  }
}

export interface ShareBookmarkDetail {
  byline: string
  content: string
  content_icon: string
  content_cover: string
  content_word_count: number
  created_at: string
  description: string
  host_url: string
  published_at: string
  site_name: string
  target_url: string
  title: string
  share_info: ShareInfo
  marks: MarkDetail
  tags: BookmarkTag[]
  user_info: {
    nick_name: string
    avatar: string
    show_userinfo: boolean
  }
  user_id: number
}

export interface BookmarkDetail {
  bookmark_id?: number
  title: string
  alias_title: string
  host_url: string
  target_url: string
  content_icon: string
  content_cover: string
  content_word_count?: number
  content: string
  description?: string
  byline?: string
  private_user?: number
  status: BookmarkParseStatus
  created_at?: string
  updated_at?: string
  published_at?: string
  user_id: number
  archived: 'inbox' | 'archive' | 'later'
  starred: 'star' | 'unstar'
  marks: MarkDetail
  tags: BookmarkTag[]
  trashed_at: string | null
  type: 'shortcut' | 'article'
}

export interface BookmarkTag {
  name: string
  show_name: string
  id: number
  system: boolean
  display?: boolean
}

export enum MarkType {
  LINE = 1,
  COMMENT = 2,
  REPLY = 3,
  ORIGIN_LINE = 4,
  ORIGIN_COMMENT = 5
}

export interface ShareDetailInfo {
  share_code: string
  show_comment_line: boolean
  allow_action: boolean
  show_userinfo: boolean
}

export interface SummaryItemModel {
  content: string
  updated_at: Date
  is_self: boolean
}

export interface HighlightItem {
  id: number
  type: 'reply' | 'mark' | 'comment'
  content: MarkSelectContent[]
  created_at: string
  title: string
  color?: string
  parent_comment?: string
  parent_comment_deleted?: boolean
  comment: string
  source_type: 'share' | 'bookmark' | 'collection'
  source_id: string
}

export interface MarkSelectContent {
  type: 'text' | 'image'
  text: string
  src: string
}

export interface SearchResultItem {
  vs_score: number
  fts_score: number
  final_score: number
  bookmark_id: number
  highlight_title: string
  highlight_content: string
  title?: string
  content?: string
  type: 'fts' | 'vector' | 'hybrid'
}

export interface SubscribeMessageReminder {
  type: 'reminder'
  unreadCount: number
}

export interface UserNotificationMessageItem {
  id: number
  is_read: boolean
  title: string
  content: string
  quote_content: string
  bookmark_title: string
  username: string
  source: 'share' | 'collection'
  object_data: {
    comment_id: number
    share_code: string
    collection_code: string
    collection_name: string
    bookmark_id: number
    cb_id: number
  }
  type: 'comment' | 'reply' | 'collection_subscriber' | 'collection_update' | 'collection_price_change'
  created_at: Date
  icon: string
}

export interface UserEnableCollectShare {
  show_name: string
  price: number
  currency: string
  collection_code: string
  status: number
  show_marks: boolean
  allow_marks: boolean
  show_profile: boolean
  service_charge_percent: number
}

export enum StripeAccountStatus {
  active = 'ACTIVE',
  filling = 'FILLING',
  pending = 'PENDING',
  reviewing = 'REVIEWING',
  deauthorized = 'DEAUTHORIZED'
}
export interface StripeAccountInfo {
  account_id: string
  stripe_status: string
  status: StripeAccountStatus
  charges_enabled: boolean
  payout_enabled: boolean
  business_profile: BusinessProfile
  stripe_capabilities: StripeCapabilities
}

export interface StripeCapabilities {
  card_payments: string
  transfers: string
}

export interface BusinessProfile {
  name: string
  mcc: string
  url?: string
  support_email?: string
  support_url?: string
}

export enum UserSubscribeCollectionType {
  unknown = 0,
  free = 1,
  paid = 2
}

export interface UserSubscribeCollectionItem {
  id: number
  type: UserSubscribeCollectionType
  code: string
  subscription_end_time: string
  display_name: string
  updated_at: string
  avatar: string
  cancelled: boolean
}

export interface UserSubscribeStatus {
  subscribed: boolean
  end_time: string
  cancelled: boolean
  deleted: boolean
}

export interface UserSubscription {
  first_subscription_at?: Date
  subscription_end_at?: Date
  subscription_homepage: string
  next_invoice_at?: Date
  subscription_type: SubscriptionType
  subscription_credit?: number
  stripe_stripe_currency?: string
}

export interface UserDetailInfo {
  name: string
  email: string
  account: string
  lang: string
  avatar: string
  timezone: string
  id: string
  platform: BindedPlatformInfo[]
  subscription: UserSubscription
  share_collect: UserShareCollectInfo
  stripe_connect: StripeAccountInfo
  aff_code?: string
  ai_lang: string
}

export interface UserShareCollectInfo {
  show_name: string
  price: number
  currency: string
  collection_code: string
  status: number
  show_marks: boolean
  allow_marks: boolean
  show_profile: boolean
  service_charge_percent: number
}

export interface UserInfo {
  userId: number
  email: string
  lang: string
  name: string
  picture: string
  timezone: string
}

export interface BookmarkExistsResp {
  exists: boolean
  parse_type: ParserType
  bookmark_id?: number
  bookmark_tags?: string[]
}

export interface AddBookmarkReq {
  target_url: string
  target_title: string
  target_icon: string
  taget_cover: string
  content: string
  tag: string[]
  description: string
}

export interface BindedPlatformInfo {
  platform: string
  user_name: string
  created_at: Date
}

export interface AddBookmarkResp {
  bmId: number
}

export interface EmptyBookmarkResp {}

export enum ParserType {
  UNKNOWN = 0,
  CLIENT_PARSE = 1,
  SERVER_FETCH_PARSE = 2,
  SERVER_PUPPETEER_PARSE = 3,
  BLOCK_PARSE = 4
}

export enum SubscriptionType {
  NO_SUBSCRIPTION = 0,
  FREE_SUBSCRIPTION = 1,
  PAID_SUBSCRIPTION = 2
}

export interface ImportProcessResp {
  id: number
  batch_count: number
  current_count: number
  status: number
  type: string
  reason: string
  created_at: string
  count: number
}

export interface BookmarkChangelog {
  target_url: string
  bookmark_id: number
}

export interface BookmarkActionChangelog extends BookmarkChangelog {
  action: 'add' | 'delete' | 'update'
}
export interface BookmarkSocketChangelog extends BookmarkActionChangelog {
  created_at: string
}

export interface BookmarkChangelogResp<T> {
  previous_sync?: number
  logs: T[]
}
