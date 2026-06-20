import type { BookmarkTag } from '@commons/types/interface'
import type { ComputedRef, InjectionKey } from 'vue'

// BookmarkTags → BookmarkTagAddPanel 的候选源注入：
// 用 provide/inject 而非 props，使「读取候选/已选 id」只重渲染 AddPanel，不重渲染 BookmarkTags。
// （BookmarkTags 任何与 chips 无关的重渲染都会经 patchBlockChildren 把 chips 的 fragment 锚点从 DOM 卸下，
//   导致随后加标签插不进去 —— Vue 3.5.38 block patch bug。）
export interface BookmarkTagPanelCtx {
  searchTags: ComputedRef<BookmarkTag[]>
  currentTagIds: ComputedRef<(number | string)[]>
}

export const BookmarkTagPanelKey: InjectionKey<BookmarkTagPanelCtx> = Symbol('BookmarkTagPanel')
