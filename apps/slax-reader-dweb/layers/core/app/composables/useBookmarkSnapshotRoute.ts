// 书签快照路由 seam（顶层 composable，自动导入）：upstream 跳自有的 /bookmarks/[id]。
// fork 通过同名文件覆盖；纯函数，缺标识返回 null 由调用方降级。
// 入参兼容 BookmarkItem(id) 与 SearchResultItem(bookmark_id)。
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
