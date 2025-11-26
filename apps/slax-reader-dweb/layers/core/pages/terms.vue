<template>
  <div class="terms">
    <main>
      <div class="terms-wrapper">
        <ContentRenderer v-if="page" :value="page" />
        <div v-else>Home not found</div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const { data: page } = await useAsyncData('terms', () => {
  return queryCollection('article').path('/terms').first()
})

definePageMeta({
  title: 'Terms of Service'
})
</script>

<style lang="scss" scoped>
@use './../styles/markdown/content.scss' as markdownContent;

.terms {
  main {
    --style: py-40px px-20px bg-#fcffff flex-center;

    .terms-wrapper {
      --style: max-w-800px;
      @include markdownContent.contentStyle;
    }
  }
}
</style>
