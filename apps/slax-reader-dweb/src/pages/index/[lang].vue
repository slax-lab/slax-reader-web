<template>
  <Homepage />
</template>

<script lang="ts" setup>
import Homepage from '~/components/Homepage.vue'

definePageMeta({ path: '/:lang(zh|en)', layout: 'blank' })

const route = useRoute()
const lang = route.params.lang as 'zh' | 'en'
await useI18n().setLocale(lang)
</script>
