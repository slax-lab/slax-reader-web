<template>
  <div class="loading-modal">
    <div class="modal-content">
      <div class="progress-container">
        <div class="progress-bar" :style="{ width: `${progress}%` }"></div>
      </div>
      <div class="text">{{ text }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  progress: number
  text: string
}>()
</script>

<style lang="scss" scoped>
.loading-modal {
  --style: fixed inset-0 z-50 flex-center bg-rgba(0, 0, 0, 0.5);

  .modal-content {
    --style: bg-white rounded-8px p-24px w-400px;

    .progress-container {
      --style: w-full h-4px bg-#eee rounded-full overflow-hidden;

      .progress-bar {
        --style: h-full bg-#16b998 transition-all duration-300;
      }
    }

    .text {
      --style: mt-16px text-center text-(14px #333);
    }
  }
}
</style>
