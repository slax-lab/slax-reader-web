<template>
  <div class="pro-icon">
    <span>Pro</span>
  </div>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
.pro-icon {
  // from-#5ad297 to-#16b998 Pro 徽章品牌绿渐变 + #fff 反色文字，保留
  --style: inline-block px-6px h-20px flex-center rounded-6px bg-gradient-to-br from-#5ad297 to-#16b998 text-(tag #fff) relative;
}
</style>
