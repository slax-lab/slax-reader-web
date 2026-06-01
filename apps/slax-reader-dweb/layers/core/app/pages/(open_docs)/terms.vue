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
import type { Collections } from '@nuxt/content'

const { locale, t } = useI18n()

// 使用 useHead 设置动态标题,而不是 definePageMeta
useHead({
  title: t('docs.title.terms')
})

const { data: page } = await useAsyncData(
  'terms',
  async () => {
    const collection = ('open_docs_' + locale.value) as keyof Collections

    const content = await queryCollection(collection).path('/terms').first()

    if (!content && locale.value !== 'en') {
      return await queryCollection('open_docs_en').path('/terms').first()
    }

    return content
  },
  {
    watch: [locale]
  }
)
</script>

<style lang="scss" scoped>
@use '#layers/core/styles/markdown/content.scss' as markdownContent;

.terms {
  main {
    --style: py-40px px-20px flex-center;
    background: var(--slax-bg);

    .terms-wrapper {
      --style: max-w-800px;
      @include markdownContent.contentStyle;
    }
  }
}
</style>

<!-- eslint-disable vue-scoped-css/enforce-style-type -->
<style lang="scss">
body {
  background: #faf8f2;
}

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(at 30% 0%, #faf5eb 0%, transparent 50%), radial-gradient(at 80% 20%, #f6efe4 0%, transparent 60%), radial-gradient(at 50% 80%, #f8efe4 0%, transparent 40%);
  z-index: -1;
  pointer-events: none;
}

[data-slax-theme='dark'] body {
  background: #141210;
}
[data-slax-theme='dark'] body::before {
  background:
    radial-gradient(at 30% 0%, #1e1810 0%, transparent 50%), radial-gradient(at 80% 20%, #1a1612 0%, transparent 60%), radial-gradient(at 50% 80%, #181410 0%, transparent 40%);
}

[data-slax-theme='eink'] body {
  background: #ffffff;
}
[data-slax-theme='eink'] body::before {
  display: none;
}
</style>
