import type { BookmarkTag, UserNotificationMessageItem } from '@commons/types/interface'
import type { ComputedRef, InjectionKey, MaybeRef, Ref } from 'vue'

// local-first 行为注入契约
// 默认 null = REST，仅 fork 插件 provide

// 书签可写操作（BookmarkCell）
export interface BookmarkActions {
  setArchive(uuid: string, archive: boolean): Promise<unknown>
  setStar(uuid: string, star: boolean): Promise<unknown>
  setTrashed(uuid: string, trashed: boolean): Promise<unknown>
  setAliasTitle(uuid: string, title: string): Promise<unknown> | unknown
}

// 本书签标签源 + 增删 + catalog（BookmarkTags 用）
export interface BookmarkTagSource {
  tags: ComputedRef<BookmarkTag[]>
  // 本地首查未返回前为 true，供消费方回退 SSR/REST tags 防闪空
  isLoading?: Readonly<Ref<boolean>>
  add(bookmarkUuid: string, tagUuid: string): Promise<unknown>
  remove(bookmarkUuid: string, tagUuid: string): Promise<unknown>
  userTags: ComputedRef<BookmarkTag[]>
  createUserTag(tagName: string): Promise<BookmarkTag>
}

// 用户标签源 + 新建（TagsHeader 用）
export interface UserTagSource {
  tags: ComputedRef<BookmarkTag[]>
  create(tagName: string): Promise<BookmarkTag>
}

// 通知未读/列表/已读（UserNotification 用）
export interface NotificationFeed {
  unreadCount: ComputedRef<number>
  items: ComputedRef<UserNotificationMessageItem[]>
  markAllRead(): Promise<unknown>
}

export interface LocalFirstAdapter {
  bookmarkActions?: () => BookmarkActions | null
  bookmarkTagSource?: (bookmarkUuid: MaybeRef<string>) => BookmarkTagSource | null
  userTagSource?: () => UserTagSource | null
  // 默认无 provide = SW 推未读
  notificationRuntime?: () => { feed: NotificationFeed | null; unreadTransport: 'sw' | 'rest' }
}

// fork 与 upstream 须 import 同一路径
export const LocalFirstAdapterKey: InjectionKey<LocalFirstAdapter> = Symbol('LocalFirstAdapter')
