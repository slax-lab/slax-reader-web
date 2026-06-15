import type { BookmarkTag, UserNotificationMessageItem } from '@commons/types/interface'
import type { ComputedRef, InjectionKey, MaybeRef } from 'vue'

// local-first 行为注入契约。
// inject 默认 null = 现状 REST，仅 fork 插件 provide；工厂惰性、各保留现状门控。

// 书签可写操作（BookmarkCell）。直接复用 useLocalBookmarks。
export interface BookmarkActions {
  setArchive(uuid: string, archive: boolean): Promise<unknown>
  setStar(uuid: string, star: boolean): Promise<unknown>
  setTrashed(uuid: string, trashed: boolean): Promise<unknown>
  setAliasTitle(uuid: string, title: string): Promise<unknown> | unknown
}

// 本书签标签源 + 增删 + 标签 catalog（BookmarkTags 用）。
// catalog 内聚于此，与 add/remove 共用门控；不复用 UserTagSource。
export interface BookmarkTagSource {
  tags: ComputedRef<BookmarkTag[]>
  add(bookmarkUuid: string, tagUuid: string): Promise<unknown>
  remove(bookmarkUuid: string, tagUuid: string): Promise<unknown>
  userTags: ComputedRef<BookmarkTag[]>
  createUserTag(tagName: string): Promise<BookmarkTag>
}

// 全部用户标签源 + 新建（TagsHeader 用，token 门控）。
export interface UserTagSource {
  tags: ComputedRef<BookmarkTag[]>
  create(tagName: string): Promise<BookmarkTag>
}

// 通知未读数 / 列表 / 标记已读（UserNotification 用）。
export interface NotificationFeed {
  unreadCount: ComputedRef<number>
  items: ComputedRef<UserNotificationMessageItem[]>
  markAllRead(): Promise<unknown>
}

export interface LocalFirstAdapter {
  bookmarkActions?: () => BookmarkActions | null
  bookmarkTagSource?: (bookmarkUuid: MaybeRef<string>) => BookmarkTagSource | null
  userTagSource?: () => UserTagSource | null
  // 默认无 provide = { feed: null, unreadTransport: 'sw' } = upstream 原 SW 推未读。
  notificationRuntime?: () => { feed: NotificationFeed | null; unreadTransport: 'sw' | 'rest' }
}

// fork 插件与 upstream 组件须 import 同一路径（同一 Symbol）。
export const LocalFirstAdapterKey: InjectionKey<LocalFirstAdapter> = Symbol('LocalFirstAdapter')
