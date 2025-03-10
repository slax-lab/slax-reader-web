<template>
  <div class="homepage">
    <section>
      <div class="main">
        <header>
          <div class="left"></div>
          <div class="right">
            <button class="border" @click="downloadClick">{{ $t('common.operate.download') }}</button>
            <button class="border" @click="tryClick">{{ $t('common.operate.login') }}</button>
          </div>
        </header>
        <div class="content">
          <img src="~/assets/images/logo.png" alt="" />
          <h1 class="app-name">{{ $t('common.app.name') }}</h1>
          <h2 class="slogan">
            {{ $t('page.index.slogan_left_bracket') }}<span>{{ slogan }}</span
            >{{ $t('page.index.slogan_right_bracket') }}
          </h2>
          <div class="cards">
            <div class="card" v-for="card in cards" :key="card.title">
              <h3 class="title">{{ card.title }}</h3>
              <span class="subtitle">{{ card.subtitle }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section>
      <div class="descript">
        <div class="banners" ref="banners">
          <div
            class="poster"
            v-for="poster in posters"
            :key="poster.title"
            v-element-hover="
              state => {
                bannerHovered = state
              }
            "
          >
            <div class="title">{{ poster.title }}</div>
            <div class="subtitle">{{ poster.subtitle }}</div>
            <ClientOnly>
              <img :src="poster.img" alt="" />
            </ClientOnly>
          </div>
        </div>
        <div class="banners-indicator" ref="bannersIndicator">
          <div class="indicator" ref="indicator" :style="{ transform: `translateX(${indicatorXOffset}px)` }"></div>
        </div>
      </div>
    </section>
    <section>
      <div class="questions">
        <h2 class="title">{{ $t('page.index.faq') }}</h2>
        <div class="faqs">
          <div class="faq" v-for="faq in faqs" :key="faq.question">
            <h3 class="question">{{ faq.question }}</h3>
            <span class="answer">{{ faq.answer }}</span>
          </div>
        </div>
      </div>
    </section>
    <AsyncHomepagePlanSection />
    <section>
      <div class="history">
        <h2 class="title">{{ $t('page.index.history') }}</h2>
        <div class="release-history">
          <ReleaseNote />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import ReleaseNote from '~/components/ReleaseNote.vue'

import { AsyncHomepagePlanSection } from './isolation/Payment'
import { vElementHover } from '@vueuse/components'
import { useScroll } from '@vueuse/core'

const { t } = useI18n()

useHead({
  titleTemplate: t('common.app.name')
})

const slogan = computed(() => t('page.index.slogan'))

const cards = computed<{ title: string; subtitle: string }[]>(() => [
  {
    title: t('page.index.cards.1.title'),
    subtitle: t('page.index.cards.1.content')
  },
  {
    title: t('page.index.cards.2.title'),
    subtitle: t('page.index.cards.2.content')
  },
  {
    title: t('page.index.cards.3.title'),
    subtitle: t('page.index.cards.3.content')
  },
  {
    title: t('page.index.cards.4.title'),
    subtitle: t('page.index.cards.4.content')
  },
  {
    title: t('page.index.cards.5.title'),
    subtitle: t('page.index.cards.5.content')
  },
  {
    title: t('page.index.cards.6.title'),
    subtitle: t('page.index.cards.6.content')
  }
])

const posters = computed<{ title: string; img: string; subtitle?: string }[]>(() => [
  {
    title: t('page.index.posters.1.title'),
    subtitle: t('page.index.posters.1.subtitle'),
    img: new URL('~/assets/images/homepage-banner-cover-1.png', import.meta.url).href
  },
  {
    title: t('page.index.posters.2.title'),
    subtitle: t('page.index.posters.2.subtitle'),
    img: new URL('~/assets/images/homepage-banner-cover-2.png', import.meta.url).href
  },
  {
    title: t('page.index.posters.3.title'),
    subtitle: t('page.index.posters.3.subtitle'),
    img: new URL('~/assets/images/homepage-banner-cover-3.png', import.meta.url).href
  }
])

const faqs = computed<{ question: string; answer: string }[]>(() => [
  {
    question: t('page.index.faqs.1.title'),
    answer: t('page.index.faqs.1.content')
  },
  {
    question: t('page.index.faqs.2.title'),
    answer: t('page.index.faqs.2.content')
  },
  {
    question: t('page.index.faqs.3.title'),
    answer: t('page.index.faqs.3.content')
  },
  {
    question: t('page.index.faqs.4.title'),
    answer: t('page.index.faqs.4.content')
  },
  {
    question: t('page.index.faqs.5.title'),
    answer: t('page.index.faqs.5.content')
  },
  {
    question: t('page.index.faqs.6.title'),
    answer: t('page.index.faqs.6.content')
  }
])

const banners = ref<HTMLDivElement>()
const bannersIndicator = ref<HTMLDivElement>()
const indicator = ref<HTMLDivElement>()
const { x } = useScroll(banners, { throttle: 100 })
const bannerHovered = ref(false)
const scrollingInterval = ref<NodeJS.Timeout>()

const indicatorXOffset = computed(() => {
  const xOffsetPercent = x.value / ((banners.value?.scrollWidth || 1) - (banners.value?.clientWidth || 1))
  const indicatorXOffset = ((bannersIndicator.value?.clientWidth || 1) - (indicator.value?.clientWidth || 1)) * xOffsetPercent
  return indicatorXOffset
})

onMounted(() => {
  scrollingInterval.value = setInterval(() => {
    scrollToNextBanner()
  }, 5000)
})

onUnmounted(() => {
  clearInterval(scrollingInterval.value)
})

const scrollToNextBanner = () => {
  if (!banners.value || bannerHovered.value) {
    return
  }

  const count = posters.value?.length || 1
  const totalOffset = banners.value.scrollWidth - banners.value.clientWidth
  const eachOffset = totalOffset / (count - 1)
  const current = Math.floor(x.value / eachOffset)
  const next = current === count - 1 ? 0 : current === 0 ? count - 1 : (current + 1) % count

  banners?.value?.scrollTo({
    left: next * eachOffset,
    behavior: 'smooth'
  })
}

const downloadClick = async () => {
  window.open('https://chromewebstore.google.com/detail/slax-reader/gdnhaajlomjkhahnmiijphnodkcfikfd')
}

const tryClick = async () => {
  await navigateTo('/bookmarks?from=homepage')
}
</script>

<style lang="scss" scoped>
.homepage {
  --style: pb-120px bg-#FCFCFC;

  h1 {
    --style: text-(28px #1f1f1f) line-height-42px font-bold;
    font-family:
      Helvetica,
      Helvetica PingFang SC;
  }

  h2 {
    --style: text-(32px #1f1f1f) line-height-42px font-500;
  }

  h3 {
    --style: font-500 text-(20px #333) line-height-28px;
  }

  section {
    --style: px-24px relative;

    &:first-child {
      --style: bg-gradient-to-br from-#f8fffc to-#e6fff3;

      &::before {
        --style: content-empty absolute bottom-0 left-0 h-300px w-full bg-gradient-to-b from-transparent to-#FCFCFC;
      }
    }

    & > *:not(header) {
      --style: max-w-1068px mx-auto;
    }
  }

  header {
    --style: absolute top-0 left-0 w-full h-84px flex items-center justify-between;

    button {
      --style: relative min-w-80px h-32px px-10px py-0px rounded-6px text-(15px #333) line-height-32px font-500 flex-center;

      &.border {
        --style: 'border-(2px solid #333) hover:(scale-102) active-(scale-105) transition-transform duration-250 ease-in-out';
      }
    }

    .left,
    .right {
      --style: flex;

      & > * {
        --style: 'not-first:ml-16px';
      }
    }
  }

  .main {
    --style: 'flex flex-col relative pb-46px max-md:(min-h-screen flex-center)';

    .content {
      --style: pt-108px w-full h-full flex flex-col items-center;
      img {
        --style: w-86px h-108px object-contain;
      }

      .app-name {
        --style: mt-24px;
      }

      .slogan {
        --style: mt-40px flex-center text-align-center;

        span {
          --style: 'max-md:(px-5px)';
        }
      }

      .cards {
        --style: 'w-full grid gap-24px mt-80px max-md:(grid-cols-2) md:(grid-cols-3)';
        .card {
          --style: bg-#fff px-24px pt-24px pb-32px rounded-8px shadow-[0px_30px_40px_0px_#0000000a] flex flex-col;

          .subtitle {
            --style: mt-8px text-(15px #999) line-height-21px;
          }
        }
      }
    }
  }

  .descript {
    --style: pt-74px relative;

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

    .banners {
      --style: 'px-10px -ml-10px h-745px flex flex-nowrap overflow-x-auto max-md:(flex-col overflow-hidden h-auto)';
      scroll-snap-type: x mandatory;
      scrollbar-width: none;
      &::-webkit-scrollbar {
        --style: hidden;
      }

      .poster {
        --style: 'flex flex-col justify-start items-start not-first:(max-md:(mt-20px) md:(ml-20px))';
        scroll-snap-align: center;

        .title {
          --style: relative ml-20px pl-20px text-(16px #333) font-500 line-height-22px;

          &::before {
            --style: content-empty absolute w-8px h-8px rounded-full top-7px left-0 bg-#0f1419;
          }
        }

        .subtitle {
          --style: ml-20px mt-8px min-h-48px text-(15px #999) line-height-24px whitespace-pre-line;
        }

        img {
          --style: mt-32px w-auto h-582px border-(2px solid #ecf0f5) shadow-[0px_30px_40px_0px_#0000000a] rounded-16px;
        }
      }
    }

    .banners-indicator {
      --style: 'relative max-md:(-bottom-20px) md:(bottom-0) left-1/2 -translate-x-1/2 w-100px h-4px bg-#ebeff4 rounded-6px flex items-center';

      .indicator {
        --style: w-66px h-4px bg-#0F1419 rounded-6px transition-transform duration-200;
      }
    }
  }

  .questions {
    --style: pt-120px mx-auto;
    .title {
      --style: font-500 text-(32px #1f1f1f) line-height-42px;
    }

    .faqs {
      --style: 'grid gap-60px mt-48px max-md:(grid-cols-1) md:(grid-cols-2)';

      .faq {
        --style: pl-24px relative flex flex-col;

        &::before {
          --style: content-empty absolute top-10px left-0 w-8px h-8px rounded-full bg-#0f1419;
        }

        .answer {
          --style: mt-8px text-(15px #999) line-height-24px whitespace-pre-wrap;
        }
      }
    }
  }

  .history {
    --style: pt-120px;

    .title {
      --style: font-500 text-(32px #1f1f1f) line-height-42px;
    }

    .release-history {
      --style: mt-31px;
    }
  }
}
</style>

<!-- eslint-disable-next-line vue-scoped-css/enforce-style-type -->
<style lang="scss">
html {
  --style: bg-#FCFCFC;
}
</style>
