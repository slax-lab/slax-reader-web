import type { BookmarkDetail, ShareBookmarkDetail } from '@commons/types/interface'
import type DetailLayout from '~/components/Layouts/DetailLayout.vue'
import type SidebarLayout from '~/components/Layouts/SidebarLayout.vue'

export enum BookmarkType {
  Normal = 'normal',
  Share = 'share'
}

export type BookmarkTypeOptions =
  | {
      type: BookmarkType.Normal
      title: string
      bmId: number
    }
  | {
      type: BookmarkType.Share
      title: string
      shareCode: string
    }

export type CommonBookmarkOptions = {
  detailLayout: Ref<InstanceType<typeof DetailLayout> | undefined>
  summariesSidebar: Ref<InstanceType<typeof SidebarLayout> | undefined>
  botSidebar: Ref<InstanceType<typeof SidebarLayout> | undefined>
  bookmarkDetail: Ref<HTMLDivElement | undefined>
}

export type BookmarkArticleDetail = BookmarkDetail | ShareBookmarkDetail
