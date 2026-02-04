<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
useSchemaOrg([
  defineOrganization({
    name: 'Slax Reader',
    url: 'https://r.slax.com/en',
    logo: 'https://r.slax.com/logo.png',
    sameAs: ['https://x.com/SlaxReader', 'https://t.me/slax_app', 'https://github.com/slax-lab/slax-reader'],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        email: 'support@slax.com',
        contactType: 'customer support'
      }
    ]
  })
])
</script>

<style lang="scss" scoped></style>
