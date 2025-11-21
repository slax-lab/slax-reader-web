<template>
  <div class="terms">
    <main>
      <div class="terms-wrapper">
        <ContentRenderer v-if="page" :value="page" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const { data: debug } = await useAsyncData('debug', () => queryCollection('content').all())
if (import.meta.server) {
  console.log(
    'Debug Content Paths:',
    debug.value?.map(c => c.path)
  )
}

const { data: page } = await useAsyncData('terms', () => {
  return queryCollection('content').path('/terms').first()
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
