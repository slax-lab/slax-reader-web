<template>
  <div class="share-tips" @click="closeClick">
    <slot />
    <Transition name="opacity">
      <div v-show="showTips" class="bubble-tips" :style="{ right: `-${triangle.right}px` }">
        <svg class="bubble-svg" v-if="containerWidth" preserveAspectRatio="none" :viewBox="viewBox" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad1" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" style="stop-color: #fcd08c; stop-opacity: 1" />
              <stop offset="100%" style="stop-color: #f9996e; stop-opacity: 1" />
            </linearGradient>
          </defs>
          <path :d="svgPath" fill="url(#grad1)" stroke="#F99F71" stroke-width="1" />
        </svg>
        <div class="bubble-container" ref="bubbleContainer" v-resize-observer="[onResizeObserver, {}]">
          <span class="bubble-title" :class="{ zh: locale === 'zh' }">{{ $t('component.share_bubble_tips.text') }}</span>
          <button class="close">
            <img class="close-img" src="@images/button-dialog-close-white.png" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { vResizeObserver } from '@vueuse/components'

//TODO: 后续这个提示组件最好抽象出来，建议以动态添加的形式实现
// 原因：1：slot里面的组件原先外部对它的样式会丢失。2：后续可能会有很多类似这种气泡提示需要实现

const { locale } = useI18n()
const userStore = useUserStore()
const showTips = ref(false)
const bubbleContainer = ref<HTMLDivElement>()
const triangle = {
  left: 10,
  right: 23
}
const topGap = 10
const radius = 8
const containerWidth = ref(bubbleContainer.value?.offsetWidth)
const bubbleHeight = 50
const bubbleWidth = computed(() => {
  return (containerWidth.value || 0) - 1
})
const viewBox = computed(() => {
  return `0 0 ${containerWidth.value} ${bubbleHeight + 1}`
})
const svgPath = computed(() => {
  return `
    M ${radius + 1},${topGap}
    Q 1,${topGap} 1,${topGap + radius}
    V ${bubbleHeight - radius}
    Q 1,${bubbleHeight} ${radius + 1},${bubbleHeight} 
    H ${bubbleWidth.value - radius}
    Q ${bubbleWidth.value},${bubbleHeight} ${bubbleWidth.value},${bubbleHeight - radius} 
    V ${topGap + radius}
    Q ${bubbleWidth.value},${topGap} ${bubbleWidth.value - radius},${topGap} 
    H ${bubbleWidth.value - triangle.right}
    L ${bubbleWidth.value - triangle.right},0
    L ${bubbleWidth.value - triangle.right - triangle.left},${topGap}
    Z
`
})

const closeClick = () => {
  if (!showTips.value) {
    return
  }

  userStore.updateShareTipsClicked()
  showTips.value = false
}

onMounted(() => {
  containerWidth.value = bubbleContainer.value?.offsetWidth
  showTips.value = userStore.showShareTips
})

const onResizeObserver = (entries: unknown | ReadonlyArray<ResizeObserverEntry>) => {
  if (!Array.isArray(entries)) {
    return
  }

  const entry = entries[0] as ResizeObserverEntry
  const { width } = entry.contentRect
  containerWidth.value = width
}
</script>

<style lang="scss" scoped>
.share-tips {
  --style: relative flex;

  .bubble-tips {
    --style: absolute z-100 top-full overflow-hidden h-51px mt-5px select-none;

    .bubble-svg {
      --style: absolute left-0 top-0 w-full h-full;
    }

    .bubble-container {
      --style: relative z-2 mt-10px flex items-center pl-16px pr-12px py-9px whitespace-nowrap shadow-[0px_30px_60px_0px_#00000014];

      .bubble-title {
        --style: text-(15px #fff) line-height-21px font-500;
        &.zh {
          --style: font-400;
        }
      }

      .close {
        --style: 'ml-10px w-16px h-16px flex-center hover:(scale-110 opacity-90) active:(scale-110) transition-all duration-250';
        .close-img {
          --style: w-full select-none;
        }
      }
    }
  }
}
</style>
