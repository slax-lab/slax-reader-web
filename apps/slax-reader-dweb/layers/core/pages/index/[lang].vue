<template>
  <Homepage />
</template>

<script lang="ts" setup>
import Homepage from '#layers/core/components/Homepage.vue'

definePageMeta({ path: '/:lang(zh|en)', layout: 'blank' })

const route = useRoute()
const lang = route.params.lang as 'zh' | 'en'
await useI18n().setLocale(lang)

const $config = useNuxtApp().$config.public
const hreflangs = [
  { hreflang: 'zh-CN', lang: 'zh' },
  { hreflang: 'zh-HK', lang: 'zh' },
  { hreflang: 'en', lang: 'en' },
  { hreflang: 'x-default', lang: 'en' }
]

useHead({
  link: hreflangs.map(({ hreflang, lang }) => ({
    rel: 'alternate',
    hreflang,
    href: `${$config.PUBLIC_BASE_URL}/${lang}`
  }))
})
</script>
