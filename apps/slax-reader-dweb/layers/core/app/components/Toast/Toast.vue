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
  padding: 8px 16px;
  border-radius: var(--slax-radius-sm);
  background: var(--slax-surface-solid);
  border: 1px solid var(--slax-border);
  box-shadow:
    var(--slax-shadow-warm),
    0 4px 16px color-mix(in srgb, var(--slax-accent) 8%, transparent);
  color: var(--slax-text-muted);
  font-size: 13px;
  line-height: 1.5;
  user-select: none;
  backdrop-filter: var(--slax-blur);
  -webkit-backdrop-filter: var(--slax-blur);

  &.success {
    border-color: color-mix(in srgb, var(--slax-accent) 30%, transparent);
    color: var(--slax-accent);
    background: color-mix(in srgb, var(--slax-accent) 6%, var(--slax-surface-solid));
  }

  &.error {
    border-color: color-mix(in srgb, var(--slax-danger) 30%, transparent);
    color: var(--slax-danger);
    background: var(--slax-danger-bg);
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
