<template>
  <div class="homepage">
    <AppHeader :show-home-links="true" />
    <HomepageHero @start-reading="handleStartReading" />
    <HomepageFeatures />
    <HomepageHowItWorks />
    <HomepageComparison />
    <HomepageCallToAction @get-started="handleStartReading" />
    <AppFooter />
  </div>
</template>
<script lang="ts" setup>
import AppFooter from './AppFooter.vue'
import AppHeader from './AppHeader.vue'
import HomepageCallToAction from './Homepage/HomepageCallToAction.vue'
import HomepageComparison from './Homepage/HomepageComparison.vue'
import HomepageFeatures from './Homepage/HomepageFeatures.vue'
import HomepageHero from './Homepage/HomepageHero.vue'
import HomepageHowItWorks from './Homepage/HomepageHowItWorks.vue'

const { t } = useI18n()

useHead({
  title: t('common.app.seo_title'),
  meta: [
    {
      name: 'description',
      content: t('common.app.description')
    },
    {
      property: 'og:title',
      content: t('common.app.name')
    },
    {
      property: 'og:description',
      content: t('common.app.description')
    },
    {
      name: 'twitter:title',
      content: t('common.app.name')
    },
    {
      name: 'twitter:description',
      content: t('common.app.description')
    }
  ]
})

const handleStartReading = async () => {
  await navigateTo('/bookmarks?from=homepage')
}
</script>
<style lang="scss" scoped>
* {
  font-family: -apple-system, 'system-ui', 'Segoe UI', Roboto, sans-serif !important;
}
.homepage {
  --style: h-screen overflow-auto;
}
</style>
