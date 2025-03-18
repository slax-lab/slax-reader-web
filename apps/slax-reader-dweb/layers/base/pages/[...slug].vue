<template>
  <div class="slug">
    <div class="header">
      <div class="header-container responsive-width">
        <div class="left">
          <div class="app" @click="logoClick">
            <div class="items-wrapper">
              <img src="@images/logo-sm.png" alt="" />
              <span class="title">{{ $t('common.app.name') }}</span>
            </div>
          </div>
        </div>
        <div class="right"></div>
      </div>
    </div>
    <div class="content">
      <div class="slug-container">
        <img src="@images/404.png" alt="" />
        <span>{{ $t('page.slug.title') }}</span>
        <button @click="logoClick">{{ $t('page.slug.back_home') }}</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const logoClick = () => {
  navigateTo('/bookmarks', {
    replace: true
  })
}
</script>

<style lang="scss" scoped>
.slug {
  --style: w-full flex flex-col items-center overflow-hidden select-none;
  --header-height: 44px;

  .responsive-width {
    --style: pl-128px;
  }

  .header {
    --style: 'fixed top-0 left-0 w-full h-[var(--header-height)] z-10 p-0 flex items-center justify-between select-none bg-#f5f5f3';

    .header-container {
      --style: flex items-center;
    }

    .left {
      .app {
        --style: flex items-center relative cursor-pointer;

        .items-wrapper {
          --style: flex items-center;

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
    }
  }

  .content {
    --style: w-full pt-[var(--header-height)] pb-68px h-screen flex-center -translate-y-25px;
    .slug-container {
      --style: flex-center flex-col;

      img {
        --style: w-204px object-contain;
      }

      span {
        --style: mt-16px text-(14px #999) line-height-20px;
      }

      button {
        --style: 'mt-100px w-274px h-48px text-(15px #1f1f1f) font-bold rounded-3xl bg-white border-(1px solid #6a6e8333) flex-center hover:(opacity-90 scale-105) transition-all duration-250';
      }
    }
  }
}
</style>

<!-- eslint-disable vue-scoped-css/enforce-style-type -->
<style lang="scss">
body {
  --style: bg-#FCFCFC;
}
</style>
