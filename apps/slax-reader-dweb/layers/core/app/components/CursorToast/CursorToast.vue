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
  --style: select-none max-w-md min-w-140px flex-center rounded-6px bg-#0b0a23 flex-wrap whitespace-break-spaces text-center color-white overflow-hidden text-ellipsis py-6px
    px-16px text-(14px) line-height-20px shadow-[0px_20px_30px_0px_#0000000a];

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
  --style: transition-all duration-250 ease-in-out;
}
</style>
