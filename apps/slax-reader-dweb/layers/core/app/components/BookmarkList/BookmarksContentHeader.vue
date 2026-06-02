<template>
  <!-- content-header slot 分发：搜索态优先，否则按 filterStatus 展示 话题/合集/通知 头部 -->
  <SearchHeader v-if="searchText" :default-search-text="searchText" @back="emit('back')" @search-status-update="status => emit('search-status-update', status)" />
  <template v-else>
    <TagsHeader v-if="filterStatus === 'topics'" :select-tag-id="filterTopicId" :select-tag-name="filterTopicName" @select-tag="info => emit('select-tag', info)" />
    <CollectionHeader
      v-if="filterStatus === 'collections'"
      :select-collect-id="filterCollectionId"
      :select-collect-name="filterCollectionName"
      @code-update="(code: string) => emit('code-update', code)"
      @select-collect="info => emit('select-collect', info)"
    />
    <NotificationHeader v-if="filterStatus === 'notifications'" @back="emit('notification-back')" />
  </template>
</template>

<script setup lang="ts">
import SearchHeader from '#layers/core/app/components/BookmarkList/SearchHeader.vue'
import TagsHeader from '#layers/core/app/components/BookmarkList/TagsHeader.vue'
import NotificationHeader from '#layers/core/app/components/Notification/NotificationHeader.vue'

// CollectionHeader 位于 components/global/，由 Nuxt 自动全局注册，无需显式 import

defineProps<{
  searchText: string
  filterStatus: string
  filterTopicId: number
  filterTopicName: string
  filterCollectionId: number
  filterCollectionName: string
}>()

const emit = defineEmits<{
  back: []
  'search-status-update': [status: boolean]
  'select-tag': [info: { id: number; name: string } | null]
  'select-collect': [info: { id: number; name: string; code: string } | null]
  'code-update': [code: string]
  'notification-back': []
}>()
</script>
