<template>
  <Transition name="cursor-toast" @after-leave="onAfterLeave">
    <div class="cursor-toast" v-show="showToast">
      <span>{{ text }}</span>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const emits = defineEmits(['dismiss'])
const props = defineProps({
  text: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: false,
    default: 1000
  }
})

const showToast = ref<boolean>(false)

onMounted(() => {
  showToast.value = true

  setTimeout(() => {
    showToast.value = false
  }, props.duration)
})

const onAfterLeave = () => {
  emits('dismiss')
}
</script>

<style lang="scss" scoped>
.cursor-toast {
  --style: select-none max-w-md min-w-140px flex-center flex-wrap whitespace-break-spaces text-center overflow-hidden text-ellipsis;
  padding: 6px 14px;
  /* 暖色深底：与设计系统暖色调一致，保持高对比 */
  background: rgba(20, 18, 15, 0.9);
  color: #f5f2ec;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--slax-radius-sm);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  font-size: var(--slax-fs-meta);
  line-height: 1.4;

  span {
    --style: w-full max-h-10 overflow-hidden text-ellipsis whitespace-nowrap;
  }
}

.cursor-toast-leave-to {
  --style: -translate-y-full;
}

.cursor-toast-enter-from {
  --style: translate-y-full;
}

.cursor-toast-leave-to,
.cursor-toast-enter-from {
  --style: opacity-0;
}

.cursor-toast-enter-active,
.cursor-toast-leave-active {
  --style: transition-all duration-normal ease-in-out;
}
</style>
