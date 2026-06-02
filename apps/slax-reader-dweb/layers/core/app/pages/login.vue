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
