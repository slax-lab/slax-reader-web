<template>
  <div class="tabs" ref="tabs">
    <button class="group" v-for="(tabItem, index) in tabList" :key="tabItem.type" :class="{ highlighted: tabType === tabItem.type }" @click="inboxClick(tabItem.type, index)">
      <img :src="tabType === tabItem.type ? tabItem.highlightedIcon : tabItem.icon" />
      <span class="text group-hover:scale-105">{{ tabItem.title }}</span>
    </button>
  </div>
  <div class="tabs">
    <button class="group trash" :class="{ highlighted: tabType === 'trashed' }" @click="inboxClick('trashed')">
      <span class="text group-hover:scale-105"><i></i> {{ $t('page.bookmarks_index.Trash') }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const tabs = ref<HTMLElement>()

defineProps({
  tabType: {
    type: String,
    default: 'inbox'
  }
})

const emits = defineEmits(['changeTab'])
const images = import.meta.glob('@images/tab-*-normal-icon.png', { eager: true, query: '?url', import: 'default' })
const highlightedImages = import.meta.glob('@images/tab-*-highlighted-icon.png', { eager: true, query: '?url', import: 'default' })
const tabList = ref<{ type: string; title: string; icon: string; highlightedIcon: string }[]>([])

onMounted(() => {
  tabList.value = BookmarkTabTypes.map(type => {
    const imageName = `tab-${type}-normal-icon.png`
    const highlightedImageName = `tab-${type}-highlighted-icon.png`

    let tabIconUrl = ''
    for (const filePath in images) {
      if (filePath.endsWith(imageName)) {
        tabIconUrl = images[filePath] as string
        break
      }
    }

    let tabHighlightedIconUrl = ''
    for (const filePath in highlightedImages) {
      if (filePath.endsWith(highlightedImageName)) {
        tabHighlightedIconUrl = highlightedImages[filePath] as string
        break
      }
    }

    return {
      type,
      title: t(`page.bookmarks_index.${type}`),
      icon: new URL(tabIconUrl, import.meta.url).href,
      highlightedIcon: new URL(tabHighlightedIconUrl, import.meta.url).href
    }
  })
})

const inboxClick = (type: string, index?: number) => {
  emits('changeTab', type, index)
}

const getAllButtons = () => {
  return tabs.value?.querySelectorAll('button') || []
}

defineExpose({
  getAllButtons
})
</script>

<style lang="scss" scoped>
.tabs {
  --style: 'w-full flex flex-col whitespace-nowrap max-md:(m-0 flex-row p-12px px-16px overflow-x-auto)';

  &::-webkit-scrollbar {
    --style: hidden;
  }

  & > * {
    --style: 'not-first:mt-8px max-md:(not-first:(m-0))';
  }

  button {
    --style: 'py-8px px-16px rounded-full text-(14px #999999) line-height-20px font-medium text-align-left transition-transform duration-250 max-md:(text-align-center px-24px) flex items-center';

    &.highlighted {
      --style: 'text-#16B998 bg-#16b9980f max-md:(bg-transparent)';
    }

    img {
      --style: 'mr-10px w-16px h-16px object-contain max-md:(hidden)';
    }

    span {
      --style: inline-block transition-all duration-250 inline-flex items-center;
    }
  }

  .trash {
    i {
      --style: inline-block w-16px h-16px bg-contain mr-10px;
      background-image: url('@images/tiny-delete-blue-fill-icon.png');
    }
  }

  &:has(.trash) {
    --style: 'mt-8px mb-60px max-md:(hidden)';
  }
}
</style>
