<template>
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
</template>

<script lang="ts" setup>
import AppleLoginButton from '#layers/core/app/components/AppleLoginButton.vue'
import GoogleLoginButton from '#layers/core/app/components/GoogleLoginButton.vue'

const props = defineProps({
  redirect: {
    type: String,
    default: ''
  },
  affcode: {
    type: String,
    default: ''
  }
})

const route = useRoute()

const turnstileCallbackToken = ref('')
const isAffUser = !!props.affcode
const showLoginBtn = computed(() => {
  return !isAffUser || (isAffUser && turnstileCallbackToken.value)
})

const googleLoginBtn = ref<InstanceType<typeof GoogleLoginButton>>()

if (route.query.from === 'homepage') {
  googleLoginBtn.value?.login()
}
</script>

<style lang="scss" scoped>
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
</style>
