<template>
  <div class="release-note">
    <div ref="ul" class="history-list">
      <div class="history-item" v-for="(timeline, index) in timelines" :key="timeline.version">
        <div class="timeline-content" :class="{ active: index === 0 }">
          <h1>{{ timeline.version }}</h1>
          <ul>
            <li v-for="content in timeline.content" :key="content">{{ `${content}` }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
const { t } = useI18n()

const timelines = computed(() => [
  {
    version: t('page.index.history_notes.head', { version: t('page.index.history_notes.6.version') }),
    content: [t('page.index.history_notes.6.1'), t('page.index.history_notes.6.2'), t('page.index.history_notes.6.3')]
  },
  {
    version: t('page.index.history_notes.5.version'),
    content: [t('page.index.history_notes.5.1')]
  },
  {
    version: t('page.index.history_notes.4.version'),
    content: [
      t('page.index.history_notes.4.1'),
      t('page.index.history_notes.4.2'),
      t('page.index.history_notes.4.3'),
      t('page.index.history_notes.4.4'),
      t('page.index.history_notes.4.5')
    ]
  },
  {
    version: t('page.index.history_notes.3.version'),
    content: [
      t('page.index.history_notes.3.1'),
      t('page.index.history_notes.3.2'),
      t('page.index.history_notes.3.3'),
      t('page.index.history_notes.3.4'),
      t('page.index.history_notes.3.5')
    ]
  },
  {
    version: t('page.index.history_notes.2.version'),
    content: [
      t('page.index.history_notes.2.1'),
      t('page.index.history_notes.2.2'),
      t('page.index.history_notes.2.3'),
      t('page.index.history_notes.2.4'),
      t('page.index.history_notes.2.5')
    ]
  },
  {
    version: t('page.index.history_notes.1.version'),
    content: [t('page.index.history_notes.1.1'), t('page.index.history_notes.1.2'), t('page.index.history_notes.1.3')]
  }
])

const ul = ref<HTMLUListElement>()
const isElementInViewport = (el: HTMLElement) => {
  var rect = el.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

const lis = ref<HTMLElement[]>([])

onMounted(() => {
  lis.value = Array.from(ul.value?.querySelectorAll('li') || [])
  ;['resize', 'scroll'].forEach(event => {
    ul.value?.addEventListener(event, handler)
  })

  handler()
})

onUnmounted(() => {
  ;['resize', 'scroll'].forEach(event => {
    ul.value?.removeEventListener(event, handler)
  })
})

const handler = () => {
  lis.value.forEach(li => {
    if (isElementInViewport(li)) {
      li.className.indexOf('active') === -1 && li.classList.add('active')
    }
  })
}
</script>

<style lang="scss" scoped>
.release-note {
  --style: relative w-full bg-transparent flex-center;

  &::before,
  &::after {
    --style: z-12 content-empty absolute w-10px h-full top-0 from-#fcfcfc to-transprent;
  }

  &::before {
    --style: left-0 bg-gradient-to-r;
  }

  &::after {
    --style: right-0 bg-gradient-to-l;
  }

  .history-list {
    --style: w-full flex overflow-x-auto whitespace-nowrap pt-7px;
    scroll-snap-type: x mandatory;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      --style: hidden;
    }

    .history-item {
      --style: ' relative flex not-first:(border-l-(1px solid #ECECEC))';
      scroll-snap-align: center;

      &:before {
        --style: content-empty absolute top-0px left-0 right-0 h-2px bg-#ECECEC -translate-y-1/2;
      }

      &:first-child {
        &:before {
          --style: left-13px;
        }

        &:after {
          --style: content-empty absolute left-0 top-0 w-18px h-12px bg-#ECECEC -translate-y-1/2;

          clip-path: polygon(0 50%, 100% 0, 72% 50%, 100% 100%); /* 定义箭头形状 */
        }
      }

      .timeline-content {
        --style: relative min-w-342px pt-32px px-24px transition-opacity duration-250;

        h1 {
          --style: relative px-28px text-(#333 18px) line-height-25px;

          &::after {
            --style: content-empty absolute rounded-full top-1/2 -translate-y-1/2 left-0 w-16px h-16px bg-#fff border-(4px solid #a8b1cd80);
          }
        }

        ul {
          --style: mt-24px;

          li {
            --style: 'px-28px relative text-(15px #999) line-height-21px not-first:(mt-8px)';

            &::marker {
              --style: content-none hidden;
            }

            &:before {
              --style: absolute top-8px left-5px w-4px h-4px bg-#999 content-empty rounded;
            }
          }
        }

        &.active {
          h1 {
            --style: text-(#16b998 18px);

            &::after {
              --style: border-#16b998;
            }
          }

          ul {
            li {
              --style: text-(15px #333);

              &:before {
                --style: bg-#333;
              }
            }
          }
        }
      }
    }
  }
}
</style>
