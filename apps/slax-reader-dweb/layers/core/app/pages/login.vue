<template>
  <div class="login">
    <div style="flex: 1"></div>
    <div class="content">
      <LoginView :redirect="redirect" :affcode="affcode" />
    </div>
    <div style="flex: 2"></div>
  </div>
</template>

<script lang="ts" setup>
import LoginView from '#layers/core/app/components/global/LoginView.vue'

const route = useRoute()
const redirect = `${route.query.redirect || ''}`
const affcode = `${route.query.aff || ''}`

const { t } = useI18n()

useHead({
  titleTemplate: `${t('common.operate.login')} - ${t('common.app.name')}`
})

onMounted(() => {
  analyticsLog({
    event: 'user_view_login'
  })
})
</script>

<style lang="scss" scoped>
.login {
  --style: w-screen h-screen flex flex-(col wrap) items-center justify-between;

  .content {
    --style: mt-5;
  }
}
</style>
