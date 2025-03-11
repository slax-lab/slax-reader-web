<template>
  <div class="notifications-header" v-show="showHeader">
    <button class="bg-[length:16px_16px] bg-[url('~/assets/images/button-navigate-back.png')] bg-center" @click="back"></button>
    <span>{{ $t('component.notification_header.title') }} </span>
  </div>
</template>

<script lang="ts" setup>
const emits = defineEmits(['back'])
const showHeader = ref(false)

onMounted(() => {
  const history = window.history
  showHeader.value = history.length > 2
})

const back = () => {
  emits('back')
}
</script>

<style lang="scss" scoped>
.notifications-header {
  --style: flex items-center pt-24px pl-24px pb-4px;

  button {
    --style: w-16px h-16px;
  }

  span {
    --style: ml-14px text-(#333 16px) line-height-20px font-500;
  }
}
</style>
