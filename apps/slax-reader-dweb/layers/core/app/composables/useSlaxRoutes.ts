// 路由 seam 汇总
// fork ...base 继承，只改差异
import type { HighlightItem } from '@commons/types/interface'

export type BookmarkSnapshotSource = {
  id?: number
  bookmark_id?: number
  bookmark_user_uuid?: string
}

export function useSlaxRoutes() {
  // 划线跳转，按来源分流
  const highlightRoute = (item: HighlightItem): string => {
    const q = `?highlight=${item.id}`
    switch (item.source_type) {
      case 'share':
        return `/s/${item.source_id}${q}`
      case 'collection':
        return `/c/${item.source_id}${q}`
      default:
        return `/bookmarks/${item.source_id}${q}`
    }
  }

  // 快照跳转，缺标识返回 null
  const snapshotRoute = (source: BookmarkSnapshotSource): string | null => {
    const id = source.id ?? source.bookmark_id
    if (id === undefined || id === null) {
      return null
    }

    return `/bookmarks/${id}`
  }

  return { highlightRoute, snapshotRoute }
}
