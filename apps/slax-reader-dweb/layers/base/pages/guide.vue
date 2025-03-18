<template>
  <div class="guide">
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
      <div class="responsive-width guide-container">
        <div class="guide-header">
          <img src="@images/smileface-bg.png" />
          <div class="text">
            <h1>{{ $t('page.guide.title') }}</h1>
            <span>{{ $t('page.guide.subtitle') }}</span>
          </div>
        </div>
        <div class="guide-content">
          <div class="scroll-content">
            <div v-for="(guide, index) in guides" :key="guide.title" class="guide-card">
              <h1>{{ (index + 1).toString().padStart(2, '0') }}</h1>
              <span>{{ guide.title }}</span>
              <img :src="guide.img" />
            </div>
          </div>
        </div>
        <div class="guide-footer" v-if="!isLogined">
          <span class="footer-title">{{ $t('page.guide.operate_title') }}</span>
          <div class="operate">
            <GoogleLoginButton />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import GoogleLoginButton from '#layers/base/components/GoogleLoginButton.vue'

import { useUserStore } from '#layers/base/stores/user'

interface Guide {
  title: string
  img: string
}

const { t } = useI18n()
const isLogined = haveRequestToken()

const guides: Guide[] = [
  {
    title: t('page.guide.guides.1.title'),
    img: new URL('@images/guide-banner-cover-1.png', import.meta.url).href
  },
  {
    title: t('page.guide.guides.2.title'),
    img: new URL('@images/guide-banner-cover-2.png', import.meta.url).href
  },
  {
    title: t('page.guide.guides.3.title'),
    img: new URL('@images/guide-banner-cover-3.png', import.meta.url).href
  }
]

const userStore = useUserStore()

const logoClick = () => {
  navigateTo(userStore.userInfo ? '/bookmarks' : '/guide', {
    replace: true
  })
}
</script>

<style lang="scss" scoped>
.guide {
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
    --style: w-full pt-[var(--header-height)] pb-68px;
    .guide-container {
      --style: pt-40px;

      .guide-header {
        --style: flex items-center;
        img {
          --style: w-132px;
        }

        .text {
          --style: ml-24px flex flex-col text-#333 line-height-20px whitespace-nowrap;

          h1 {
            --style: text-24px font-600;
          }

          span {
            --style: mt-12px text-15px;
          }
        }
      }

      .guide-content {
        --style: w-full relative;

        &::before,
        &::after {
          --style: z-2 content-empty absolute w-10px h-full top-0 from-#fcfcfc to-transprent;
        }

        &::before {
          --style: -left-10px bg-gradient-to-r;
        }

        &::after {
          --style: right-0px bg-gradient-to-l;
        }

        .scroll-content {
          --style: overflow-auto mt-40px flex px-10px -ml-10px;
          scroll-snap-type: x mandatory;
          scrollbar-width: none;
          &::-webkit-scrollbar {
            --style: hidden;
          }

          .guide-card {
            --style: p-24px max-w-402px min-h-320px bg-#fff rounded-8px border-(1px solid #ecf0f5) flex flex-col flex-start;
            scroll-snap-align: center;

            &:not(:first-child) {
              --style: ml-16px;
            }

            h1 {
              --style: text-(24px #333) line-height-20px font-600;
            }

            span {
              --style: mt-16px text-(14px #333) line-height-20px font-500;
            }

            img {
              --style: mt-30px w-355px object-contain;
            }
          }
        }
      }
    }
  }

  .guide-footer {
    --style: mt-68px flex items-center;

    .footer-title {
      --style: text-(15px #0f1419) line-height-20 font-500 shrink-0;
    }

    .operate {
      --style: ml-24px;
      // eslint-disable-next-line vue-scoped-css/no-unused-selector
      .google-login-button {
        --style: w-274px;
      }
    }
  }
}
</style>

<!-- eslint-disable-next-line vue-scoped-css/enforce-style-type -->
<style lang="scss">
body {
  --style: bg-#FCFCFC;
}
</style>
