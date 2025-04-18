import type { UserBookmarkChangelog, UserInfo } from '@commons/types/interface'

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
  action: UserBookmarkChangelog['log_action']
}

export interface BookmarkDBChange {
  user_id: number
  bookmark_id: number
  hash_url: string
}
