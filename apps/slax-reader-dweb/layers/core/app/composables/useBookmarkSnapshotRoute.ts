// 快照路由 seam（upstream → /bookmarks/[id]）
// fork 同名文件覆盖；缺标识返回 null
type BookmarkSnapshotSource = {
  id?: number
  bookmark_id?: number
  bookmark_user_uuid?: string
}

export default function useBookmarkSnapshotRoute(source: BookmarkSnapshotSource): string | null {
  const id = source.id ?? source.bookmark_id
  if (id === undefined || id === null) {
    return null
  }

  return `/bookmarks/${id}`
}
