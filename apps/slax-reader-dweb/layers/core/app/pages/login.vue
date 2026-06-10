<template>
  <div class="auth-wrap">
    <div class="auth-stack">
      <LoginView :redirect="redirect" :affcode="affcode" />
    </div>
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
.auth-wrap {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  position: relative;

  // 渐变背景氛围
  &::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(at 30% 0%, var(--slax-grad-a) 0%, transparent 50%), radial-gradient(at 80% 20%, var(--slax-grad-b) 0%, transparent 60%),
      radial-gradient(at 50% 80%, var(--slax-grad-c) 0%, transparent 40%);
    z-index: -1;
    pointer-events: none;
  }

  @media (max-width: 540px) {
    padding: 24px 16px;
    align-items: flex-start;
    padding-top: 60px;
  }
}

.auth-stack {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
