import type DetailLayout from '#layers/core/components/Layouts/DetailLayout.vue'
import type SidebarLayout from '#layers/core/components/Layouts/SidebarLayout.vue'

export type CommonBookmarkOptions = {
  detailLayout: Ref<InstanceType<typeof DetailLayout> | undefined>
  summariesSidebar: Ref<InstanceType<typeof SidebarLayout> | undefined>
  botSidebar: Ref<InstanceType<typeof SidebarLayout> | undefined>
  bookmarkDetail: Ref<HTMLDivElement | undefined>
}
