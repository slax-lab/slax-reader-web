<template>
  <div class="login">
    <div style="flex: 1"></div>
    <div class="content">
      <div class="login-view">
        <div class="content">
          <img class="w-86px" src="@images/logo.png" />
          <div class="mt-24px flex flex-col items-center">
            <div class="title">{{ $t('common.app.name') }}</div>
            <div class="subtitle">{{ $t('component.login_view.title') }}</div>
          </div>
          <NuxtTurnstile class="mt-24px" v-if="!!affcode" v-model="turnstileCallbackToken" :options="{ theme: 'light' }" />
          <div v-if="showLoginBtn" class="login-buttons">
            <GoogleLoginButton ref="googleLoginBtn" :redirect="redirect" :affcode="affcode" />
            <AppleLoginButton ref="appleLoginBtn" :redirect="redirect" :affcode="affcode" />
          </div>
        </div>
      </div>
    </div>
    <div style="flex: 2"></div>
  </div>
</template>

<script lang="ts" setup>
import AppleLoginButton from '#layers/core/app/components/AppleLoginButton.vue'
import GoogleLoginButton from '#layers/core/app/components/GoogleLoginButton.vue'

const route = useRoute()
const redirect = `${route.query.redirect || ''}`
const affcode = `${route.query.aff || ''}`

const turnstileCallbackToken = ref('')
const isAffUser = !!affcode
const showLoginBtn = computed(() => {
  return !isAffUser || (isAffUser && turnstileCallbackToken.value)
})

const googleLoginBtn = ref<InstanceType<typeof GoogleLoginButton>>()

if (route.query.from === 'homepage') {
  googleLoginBtn.value?.login()
}

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

    .login-view {
      --style: 'min-w-md max-md:(min-w-auto) p-10 select-none relative';
      background: var(--slax-surface);
      border: 1px solid var(--slax-border);
      border-radius: var(--slax-radius);
      box-shadow:
        var(--slax-shadow-warm),
        inset 0 1px 0 var(--slax-inset-hi);

      .content {
        --style: flex flex-col z-1 items-center relative;

        .title {
          font-family: var(--slax-font-serif);
          font-size: var(--slax-fs-display);
          font-weight: bold;
          color: var(--slax-text);
          line-height: 42px;
        }

        .subtitle {
          --style: mt-48px line-height-22px;
          font-size: var(--slax-fs-body);
          color: var(--slax-text-muted);
        }

        .login-buttons {
          --style: flex flex-col gap-10px mt-24px;
        }

        // eslint-disable-next-line vue-scoped-css/no-unused-selector
        .google-login-button {
          --style: mt-0;
        }
      }
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
