<template>
  <div class="delete-account-notice">
    <main>
      <div class="language-tabs">
        <button :class="['language-tab', { active: currentLang === 'zh' }]" @click="currentLang = 'zh'">中文</button>
        <button :class="['language-tab', { active: currentLang === 'en' }]" @click="currentLang = 'en'">English</button>
      </div>
      <div class="delete-account-notice-wrapper">
        <ContentRenderer v-if="currentPage" :value="currentPage" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

const currentLang = ref<'zh' | 'en'>('zh')

const { data: zhPage } = await useAsyncData('delete-account-notice-zh', async () => {
  return await queryCollection('open_docs_zh').path('/delete-account-notice').first()
})

const { data: enPage } = await useAsyncData('delete-account-notice-en', async () => {
  return await queryCollection('open_docs_en').path('/delete-account-notice').first()
})

const currentPage = computed(() => {
  return currentLang.value === 'zh' ? zhPage.value : enPage.value
})

const title = t('docs.title.delete_account_notice')

useHead({
  titleTemplate: `${title} - ${$t('common.app.name')}`
})
</script>

<style lang="scss" scoped>
@use '#layers/core/styles/markdown/content.scss' as markdownContent;

.delete-account-notice {
  main {
    --style: py-40px px-20px bg-#fcffff flex-center flex-col;

    .language-tabs {
      --style: flex justify-center items-center gap-12px mb-32px w-full;

      .language-tab {
        --style: py-10px px-24px border-none bg-transparent rounded-20px cursor-pointer text-15px font-500 color-#999999 transition-all duration-250 ease line-height-1
          whitespace-nowrap min-w-100px text-center h-40px inline-flex items-center justify-center;

        &:hover {
          --style: color-#16b998 transform-scale-105;
        }

        &.active {
          --style: bg-#16b9981f color-#16b998 font-600;
        }
      }
    }

    .delete-account-notice-wrapper {
      --style: w-full max-w-800px p-10px;
      @include markdownContent.contentStyle;
    }
  }
}
</style>
