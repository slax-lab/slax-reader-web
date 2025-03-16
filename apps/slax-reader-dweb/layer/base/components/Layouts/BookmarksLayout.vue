<template>
  <div class="bookmarks-layout">
    <div class="small-screen-trigger" ref="smallScreenTrigger"></div>
    <div class="header">
      <div class="left">
        <div class="app">
          <div class="items-wrapper">
            <img src="@images/logo-sm.png" alt="" />
            <span class="title">{{ $t('common.app.name') }}</span>
            <ProIcon />
          </div>
        </div>
        <div class="inbox blank">
          <slot name="sidebar-left" />
        </div>
      </div>
      <div class="responsive-width relative h-full">
        <slot name="top-modals" />
      </div>
      <div class="right">
        <div class="operates">
          <slot name="operates" />
        </div>
        <div class="blank tools">
          <slot name="sidebar-right" />
        </div>
      </div>
    </div>
    <div class="content">
      <div class="left"><!-- 这个元素仅起一个占位的作用 --></div>
      <div class="responsive-width list">
        <slot name="content-header" />
        <slot name="content-list" />
      </div>
      <div class="right">
        <div class="blank"><!-- 这个元素仅起一个占位的作用 --></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ProIcon from '#layers/base/components/ProIcon.vue'
const smallScreenTrigger = ref<HTMLDivElement>()

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
  --style: w-full flex flex-col items-center overflow-hidden;
  --header-height: 44px;

  .responsive-width {
    --style: 'max-w-900px max-md:(w-full) md:(w-900px)';
  }

  .small-screen-trigger {
    --style: 'h-0 bg-transparent max-md:(opacity-100) md:(opacity-0)';
  }

  .header {
    --style: 'fixed top-0 left-0 w-full h-[var(--header-height)] z-10 p-0 flex items-center justify-between select-none bg-#f5f5f3';
    --md-height: calc(100vh - var(--header-height));
    .left {
      --style: h-full flex-1 flex flex-row-reverse items-center relative;

      .app {
        --style: min-w-200px flex items-center relative;

        .items-wrapper {
          --style: 'absolute top-0 left-0 h-full flex items-center max-md:(pl-40px) md:(pl-60px)';

          & > * {
            --style: 'not-first:ml-8px shrink-0';
          }

          img {
            --style: w-20px;
          }

          .title {
            --style: font-semibold text-(#16b998 15px) line-height-21px;
          }
        }
      }

      .inbox {
        --style: 'w-180p max-md:(p-0 left-0 w-vw bg-gradient-to-b from-#FAFAF9 to-#fcfcfc) md:(right-0 pl-44px pr-16px pt-18px min-w-200px h-[var(--md-height)] flex flex-col justify-between) absolute top-full z-1';
      }
    }

    .right {
      --style: h-full flex-1 flex items-center relative;
      .operates {
        --style: 'min-w-200px pl-9px pr-40px relative flex flex-row items-center max-md:(justify-end) md:(justify-start)';
      }

      .tools {
        --style: 'w-180p overflow-hidden max-md:(hidden) md:(left-0 min-w-200px h-[var(--md-height)]) absolute top-full z-1';
      }
    }
  }

  .content {
    --style: 'w-full flex justify-center max-md:(flex-col) md:(flex-row) bg-#fcfcfc';

    .blank {
      --style: ' w-200px';
    }

    .left {
      --style: 'pt-[var(--header-height)] flex-1 min-w-200px max-md:(w-full pl-0 pb-[var(--header-height)])';
    }

    .list {
      --style: 'flex-grow-1 flex-shrink-1 overflow-auto max-md:(pt-0 min-h-0) md:(pt-11 min-h-screen) relative';
    }

    .right {
      --style: 'flex-1 min-w-200px max-md:(hidden) relative';
    }
  }
}
</style>
