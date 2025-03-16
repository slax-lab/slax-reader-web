<template>
  <Transition name="opacity" @after-leave="onAfterLeave">
    <div class="article-selection-menus" v-show="appear" v-on-click-outside="handleClickOutside">
      <button class="menu" v-for="menu in menus" :key="menu.id" @click="e => handleClick(menu.id, e)">
        <img :src="menu.icon" />
        <span>{{ menu.name }}</span>
      </button>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { MenuType } from './type'
import { vOnClickOutside } from '@vueuse/components'
import { showLoginModal } from '#layers/base/components/Modal'

interface MenuItem {
  id: MenuType
  name: string
  icon: string
}

const props = defineProps(['allowAction'])
const emits = defineEmits(['action', 'dismiss', 'noAction'])
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
      icon: new URL('~/assets/images/menu-copy-icon.png', import.meta.url).href
    }
  ]
  if (props.allowAction) {
    menus.value.push(
      ...[
        {
          id: MenuType.Stroke,
          name: t('common.operate.line'),
          icon: new URL('~/assets/images/menu-stroke-icon.png', import.meta.url).href
        },
        {
          id: MenuType.Comment,
          name: t('common.operate.comment'),
          icon: new URL('~/assets/images/menu-comment-icon.png', import.meta.url).href
        }
      ]
    )
  }

  menus.value.push({
    id: MenuType.Chatbot,
    name: t('common.operate.chatbot'),
    icon: new URL('~/assets/images/menu-chatbot-icon.png', import.meta.url).href
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
.article-selection-menus {
  --style: p-4px bg-#fff shadow-[0px_20px_40px_0px_#00000029] rounded-8px border-(1px solid #a8b1cd33) inline-flex items-center;

  .menu {
    --style: 'px-12px py-8px rounded-6px cursor-pointer flex items-center hover:(bg-#f5f5f3) active:(scale-105) transition-all duration-250';

    img {
      --style: w-24px h-24px object-fit;
    }

    span {
      --style: ml-2px text-(13px #999) line-height-18px shrink-0;
    }
  }
}
</style>
