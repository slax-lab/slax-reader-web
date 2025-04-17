import type { UserInfo } from '@commons/types/interface'

export interface UserData {
  userInfo: UserInfo | null
  token: string | null
  bookmarks: string[]
}

export interface BookmarkRecord {
  hashUrl: string
  bookmarkId: number
}

export interface BookmarkDBRecord {
  user_id: number
  bookmark_id: number
  url_hash: string
}
