<template>
  <div class="menu-dots" ref="dotsMenu">
    <button class="menu-dots" @click="dotsClick">
      <img src="@/assets/menu-dots.png" />
    </button>

    <Transition name="operates">
      <div class="menus-container" v-show="isShowBubble" v-on-click-outside="outsideClick">
        <div class="menus">
          <div class="menu" v-for="action in actions" :key="action.id" @click="e => actionClick(e, action)">
            <span>{{ action.name }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts">
export interface DotsMenuActionItem {
  id: string
  name: string
}
</script>

<script lang="ts" setup>
import { vOnClickOutside } from '@vueuse/components'

defineProps({
  actions: {
    type: Array as PropType<DotsMenuActionItem[]>,
    required: true
  }
})

const emits = defineEmits(['action'])

const dotsMenu = ref<HTMLDivElement>()
const isShowBubble = ref(false)

const outsideClick = () => {
  isShowBubble.value = false
}

const dotsClick = (e: Event) => {
  e.stopPropagation()

  isShowBubble.value = !isShowBubble.value
}

const actionClick = (e: Event, action: DotsMenuActionItem) => {
  e.stopPropagation()

  emits('action', action)
}
</script>

<style lang="scss" scoped>
.menu-dots {
  --style: relative;

  button {
    --style: w-18px h-auto flex-center box-content p-5px rounded-5px;
    --style: 'hover:(bg-#262626) active:(scale-130) transition-all duration-250';

    img {
      --style: w-full select-none;
    }
  }

  .menus-container {
    --style: z-1 absolute bottom-full right-0 mb-7px mr-1px;

    .menus {
      --style: rounded-8px bg-#1f1f1f min-w-80px border-(1px solid #ffffff0a);

      .menu {
        --style: h-34px flex-center cursor-pointer transition-colors duration-250 border-1px;
        --style: 'not-first:border-t-(1px solid #ffffff0a) hover:(bg-#262626)';

        span {
          --style: text-(#ffffff99 13px) line-height-18px;
        }
      }
    }
  }
}

.operates-leave-to,
.operates-enter-from {
  --style: 'opacity-0';
}

.operates-enter-active,
.operates-leave-active {
  --style: transition-all duration-250 ease-in-out;
}
</style>
