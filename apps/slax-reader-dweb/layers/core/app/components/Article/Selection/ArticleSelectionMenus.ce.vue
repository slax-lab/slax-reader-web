<template>
  <Transition name="opacity" @after-leave="onAfterLeave">
    <div :class="{ dark: dark }" v-show="appear">
      <div
        class="article-selection-menus"
        v-click-outside="{
          handler: handleClickOutside,
          exclude: () => [articleSelectionMenus]
        }"
        ref="articleSelectionMenus"
      >
        <button class="menu" v-for="menu in menus" :key="menu.id" @click="e => handleClick(menu.id, e)">
          <img :src="menu.icon" />
          <span>{{ menu.name }}</span>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ClickOutside } from '@commons/utils/directive'

import { MenuType } from './type'
import { showLoginModal } from '#layers/core/app/components/Modal'
import { useUserStore } from '#layers/core/app/stores/user'
interface MenuItem {
  id: MenuType
  name: string
  icon: string
}

const props = defineProps({
  allowAction: {
    type: Boolean,
    required: false
  },
  dark: {
    type: Boolean,
    required: false
  }
})
const emits = defineEmits(['action', 'dismiss', 'noAction'])

const vClickOutside = ClickOutside
const articleSelectionMenus = useTemplateRef('articleSelectionMenus')
const menus = ref<MenuItem[]>([])
const appear = ref(false)

const t = (text: string) => {
  return useNuxtApp().$i18n.t(text)
}

const updateMenus = () => {
  menus.value = [
    {
      id: MenuType.Copy,
      name: t('common.operate.copy'),
      icon: !props.dark ? new URL('@images/menu-copy-icon.png', import.meta.url).href : new URL('@images/menu-copy-icon-dark.png', import.meta.url).href
    }
  ]
  if (props.allowAction) {
    menus.value.push(
      ...[
        {
          id: MenuType.Stroke,
          name: t('common.operate.line'),
          icon: !props.dark ? new URL('@images/menu-stroke-icon.png', import.meta.url).href : new URL('@images/menu-stroke-icon-dark.png', import.meta.url).href
        },
        {
          id: MenuType.Comment,
          name: t('common.operate.comment'),
          icon: !props.dark ? new URL('@images/menu-comment-icon.png', import.meta.url).href : new URL('@images/menu-comment-icon-dark.png', import.meta.url).href
        }
      ]
    )
  }

  menus.value.push({
    id: MenuType.Chatbot,
    name: t('common.operate.chatbot'),
    icon: !props.dark ? new URL('@images/menu-chatbot-icon.png', import.meta.url).href : new URL('@images/menu-chatbot-icon-dark.png', import.meta.url).href
  })
}

nextTick(() => {
  appear.value = true
})

const handleClick = (id: MenuType, event: MouseEvent) => {
  if (id !== MenuType.Copy && !useUserStore().userInfo) {
    return showLoginModal({
      redirect: window.location.href
    })
  }
  emits('action', id, event)
  appear.value = false
}

const handleClickOutside = () => {
  emits('noAction')
  appear.value = false
}

watch(
  () => props.allowAction,
  () => {
    updateMenus()
  },
  { immediate: true }
)

const onAfterLeave = () => {
  emits('dismiss')
}

onUnmounted(() => {})
</script>

<style lang="scss" scoped>
@use '#layers/core/styles/global.scss' as *;

// 本组件消费的 token（dark prop override 需全覆盖）：
//   --slax-surface-solid, --slax-surface, --slax-text-light
// 其余颜色 (#a8b1cd33 蓝灰辅助、#00000029 阴影规格) 保持 inline。

.article-selection-menus {
  --style: p-4px shadow-[0px_20px_40px_0px_#00000029] rounded-8px border-(1px solid #a8b1cd33) inline-flex items-center bg-surface-solid;

  .menu {
    --style: 'px-10px py-4px rounded-6px whitespace-nowrap cursor-pointer flex items-center active:(scale-105) transition-all duration-normal';

    &:hover {
      --style: bg-surface;
    }

    img {
      --style: w-24px h-24px object-fit;
    }

    span {
      --style: ml-2px text-(aux) line-height-18px shrink-0 whitespace-nowrap text-txt-light;
    }
  }
}

// dark prop：iframe 浮层场景强制深色（与全站主题正交，宿主原网页可能浅色也可能深色）。
// 完整覆盖本组件 scoped 内消费的全部 token；CSS 自定义属性默认 inherit，
// 子元素 .article-selection-menus 通过 cascade 自动拿到 override。
.dark {
  --slax-surface-solid: #1e1b18;
  --slax-surface: rgba(30, 27, 24, 0.75);
  --slax-text-light: #6a5f52;
}
</style>
