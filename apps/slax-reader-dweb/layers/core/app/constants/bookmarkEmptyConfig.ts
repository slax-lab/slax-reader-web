// 书签列表各 tab 空态配置：内联 SVG icon path + i18n key
// title/desc 依赖 useI18n 的 t()，故此处只存 i18n key，由消费组件拼装文案
// 对应原 pages/bookmarks/index.vue 的 emptyViewConfig

export interface BookmarkEmptyEntry {
  /** 内联 SVG path 字符串（v-html 注入到 <svg> 内） */
  iconPath: string
  /** 标题 i18n key */
  titleKey: string
  /** 描述 i18n key */
  descKey: string
}

// 各 filterStatus 对应的空态配置
export const BOOKMARK_EMPTY_CONFIG: Record<string, BookmarkEmptyEntry> = {
  starred: {
    iconPath: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    titleKey: 'page.bookmarks_index.empty_starred_title',
    descKey: 'page.bookmarks_index.empty_starred_desc'
  },
  topics: {
    iconPath:
      '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    titleKey: 'page.bookmarks_index.empty_topics_title',
    descKey: 'page.bookmarks_index.empty_topics_desc'
  },
  highlights: {
    iconPath: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    titleKey: 'page.bookmarks_index.empty_highlights_title',
    descKey: 'page.bookmarks_index.empty_highlights_desc'
  },
  archive: {
    iconPath: '<path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/>',
    titleKey: 'page.bookmarks_index.empty_archive_title',
    descKey: 'page.bookmarks_index.empty_archive_desc'
  },
  trashed: {
    iconPath: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>',
    titleKey: 'page.bookmarks_index.empty_trash_title',
    descKey: 'page.bookmarks_index.empty_trash_desc'
  },
  collections: {
    iconPath: '<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>',
    titleKey: 'page.bookmarks_index.empty_collections_title',
    descKey: 'page.bookmarks_index.empty_collections_desc'
  },
  notifications: {
    iconPath: '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
    titleKey: 'page.bookmarks_index.empty_notifications_title',
    descKey: 'page.bookmarks_index.empty_notifications_desc'
  }
}

// 未匹配 tab 的兜底空态配置
export const BOOKMARK_EMPTY_FALLBACK: BookmarkEmptyEntry = {
  iconPath: '<circle cx="12" cy="12" r="10"/>',
  titleKey: 'page.bookmarks_index.empty',
  descKey: ''
}
