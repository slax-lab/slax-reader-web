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
import type { Collections } from '@nuxt/content'

const { locale, t } = useI18n()

const title = t('docs.title.privacy')

definePageMeta({
  title
})

const { data: page } = await useAsyncData(
  'privacy',
  async () => {
    const collection = ('open_docs_' + locale.value) as keyof Collections

    const content = await queryCollection(collection).path('/privacy').first()

    if (!content && locale.value !== 'en') {
      return await queryCollection('open_docs_en').path('/privacy').first()
    }

    return content
  },
  {
    watch: [locale]
  }
)
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
