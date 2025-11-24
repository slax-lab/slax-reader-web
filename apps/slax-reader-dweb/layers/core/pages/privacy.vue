<template>
  <div class="privacy">
    <main>
      <div class="privacy-wrapper">
        <ContentRenderer v-if="page" :value="page" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const { data: page } = await useAsyncData('privacy', () => {
  return queryCollection('article').path('/privacy').first()
})

definePageMeta({
  title: 'Privacy Policy'
})
</script>

<style lang="scss" scoped>
@use './../styles/markdown/content.scss' as markdownContent;

.privacy {
  main {
    --style: py-40px px-20px bg-#fcffff flex-center;

    .privacy-wrapper {
      --style: max-w-800px;
      @include markdownContent.contentStyle;
    }
  }
}
</style>
