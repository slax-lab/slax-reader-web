import type DetailLayout from '#layers/base/components/Layouts/DetailLayout.vue'
import type SidebarLayout from '#layers/base/components/Layouts/SidebarLayout.vue'

export type CommonBookmarkOptions = {
  detailLayout: Ref<InstanceType<typeof DetailLayout> | undefined>
  summariesSidebar: Ref<InstanceType<typeof SidebarLayout> | undefined>
  botSidebar: Ref<InstanceType<typeof SidebarLayout> | undefined>
  bookmarkDetail: Ref<HTMLDivElement | undefined>
}
