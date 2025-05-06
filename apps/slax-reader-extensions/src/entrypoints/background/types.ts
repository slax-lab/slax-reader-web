import type { BookmarkActionChangelog, BookmarkSocketChangelog, UserInfo } from '@commons/types/interface'

export interface UserData {
  userInfo: UserInfo | null
  token: string | null
  bookmarks: string[]
}

export interface BookmarkChange {
  hashUrl: string
  bookmarkId: number
}

export interface BookmarkActionChange extends BookmarkChange {
  action: BookmarkActionChangelog['action']
}

export interface BookmarkDBChange {
  user_id: number
  bookmark_id: number
  hash_url: string
}

export type BookmarkSocketData = {
  type: 'bookmark_changes'
  data: BookmarkSocketChangelog
}
