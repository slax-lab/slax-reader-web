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
import { showLoginModal } from '#layers/core/components/Modal'
import { useUserStore } from '#layers/core/stores/user'
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

.article-selection-menus {
  --style: p-4px shadow-[0px_20px_40px_0px_#00000029] rounded-8px border-(1px solid #a8b1cd33) inline-flex items-center;
  --style: ' bg-#fff dark:bg-#262626';

  .menu {
    --style: 'px-10px py-4px rounded-6px whitespace-nowrap cursor-pointer flex items-center active:(scale-105) transition-all duration-250';

    &:hover {
      --style: 'bg-#f5f5f3 dark:bg-#333333FF';
    }

    img {
      --style: w-24px h-24px object-fit;
    }

    span {
      --style: ml-2px text-(13px) line-height-18px shrink-0 whitespace-nowrap;
      --style: 'text-#999 dark:text-#ffffff66';
    }
  }
}
</style>
