<template>
  <Transition name="toast" @after-leave="onAfterLeave">
    <div class="text-toast" :class="{ success: type === ToastType.Success, error: type === ToastType.Error }" v-show="showToast">
      <span>{{ text }}</span>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { nextTick, onUnmounted, ref } from 'vue'

import { ToastType } from './type'

const emits = defineEmits(['dismiss'])
defineProps<{
  type: ToastType
  text: string
}>()

const showToast = ref<boolean>(false)
nextTick(() => {
  showToast.value = true

  setTimeout(() => {
    showToast.value = false
  }, 2500)
})

onUnmounted(() => {
  console.log('component dismiss.')
})
const onAfterLeave = () => {
  emits('dismiss')
}
</script>

<style lang="scss" scoped>
.text-toast {
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 360px;
  min-width: 120px;
  padding: 10px 20px;
  border-radius: var(--slax-radius-sm);
  background: var(--slax-surface-solid);
  border: 1px solid var(--slax-border);
  box-shadow: var(--slax-shadow-warm);
  color: var(--slax-text);
  font-size: 14px;
  line-height: 1.5;
  user-select: none;

  &.error {
    border-color: color-mix(in srgb, var(--slax-danger) 30%, transparent);
    color: var(--slax-danger);
    // 不用半透明的 --slax-danger-bg：toast 可能浮在反馈弹窗等暗色模态之上会糊成一片，
    // 改为把 danger 实色混入不透明 surface-solid，得到带红调但完全不透明的底色（各主题自适应）
    background: color-mix(in srgb, var(--slax-danger) 12%, var(--slax-surface-solid));
  }

  span {
    width: 100%;
    max-height: 2.5em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: center;
  }
}

.toast-leave-to {
  transform: translateY(-8px);
}

.toast-enter-from {
  transform: translateY(8px);
}

.toast-leave-to,
.toast-enter-from {
  opacity: 0;
}

.toast-enter-active,
.toast-leave-active {
  transition: all var(--slax-dur-normal) ease;
}
</style>

<!-- eslint-disable vue-scoped-css/enforce-style-type -->
<style lang="scss">
.toast.toast-start {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  flex-direction: column;
  padding-top: 6px;

  & > * + * {
    margin-top: 6px;
  }
}
</style>
