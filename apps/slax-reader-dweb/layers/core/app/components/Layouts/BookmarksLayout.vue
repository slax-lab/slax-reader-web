<template>
  <div class="bookmarks-layout">
    <!-- 移动端断点检测元素：opacity-1 时表示小屏，供 isSmallScreen() 判断 -->
    <div class="small-screen-trigger" ref="smallScreenTrigger"></div>

    <!-- 顶栏：固定定位，毛玻璃效果，自包含所有内容 -->
    <BookmarksTopBar @search="emit('search', $event)" @feedback="emit('feedback')" @check-all="emit('checkAll')" />

    <!-- 主体：顶部留出 header 高度，sidebar + main 布局 -->
    <div class="layout">
      <!-- 左侧导航：sticky，≤920px 隐藏 -->
      <aside class="sidebar">
        <slot name="sidebar-left" />
      </aside>

      <!-- 主内容区 -->
      <main class="main">
        <slot name="content-header" />
        <slot name="content-list" />
      </main>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BookmarksTopBar from '#layers/core/app/components/BookmarkList/BookmarksTopBar.vue'

const emit = defineEmits<{
  search: [keyword: string]
  feedback: []
  checkAll: []
}>()

const smallScreenTrigger = ref<HTMLDivElement>()

// 通过 CSS opacity 判断当前是否为小屏（移动端）
// 小屏时 .small-screen-trigger opacity 为 1，桌面端为 0
const isSmallScreen = () => {
  if (!smallScreenTrigger.value) {
    return false
  }
  const style = window.getComputedStyle(smallScreenTrigger.value)
  return style.opacity === '1'
}

defineExpose({
  isSmallScreen
})
</script>

<style lang="scss" scoped>
.bookmarks-layout {
  --style: w-full min-h-screen bg-surface-solid;
}

// 移动端断点检测：小屏时 opacity-1，桌面端 opacity-0
.small-screen-trigger {
  --style: 'h-0 bg-transparent max-md:(opacity-100) md:(opacity-0)';
}

// 主体容器：顶部留出 header 高度，居中对齐
.layout {
  --style: max-w-shell mx-auto flex;
  padding-top: var(--slax-header-height);

  @media (max-width: 768px) {
    padding-top: var(--slax-header-h-mobile);
  }
}

// 左侧导航：sticky，≤920px 隐藏
.sidebar {
  width: 240px;
  flex-shrink: 0;
  position: sticky;
  top: var(--slax-header-height);
  height: calc(100vh - var(--slax-header-height));
  overflow-y: auto;

  @media (max-width: 920px) {
    display: none;
  }

  @media (max-width: 768px) {
    top: var(--slax-header-h-mobile);
    height: calc(100vh - var(--slax-header-h-mobile));
  }
}

// 主内容区：flex-1，内边距
.main {
  --style: flex-1 min-w-0;
  padding: 32px 40px 80px;

  @media (max-width: 920px) {
    padding: 24px 20px 80px;
  }

  @media (max-width: 768px) {
    padding: 16px 16px 80px;
  }
}
</style>
