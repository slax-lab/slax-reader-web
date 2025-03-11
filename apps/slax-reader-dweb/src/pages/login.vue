<template>
  <div class="login">
    <div style="flex: 1"></div>
    <div class="content">
      <div class="login-view">
        <div class="content">
          <img class="w-86px" src="~/assets/images/logo.png" />
          <div class="mt-24px flex flex-col items-center">
            <div class="title">{{ $t('common.app.name') }}</div>
            <div class="subtitle">{{ $t('component.login_view.title') }}</div>
          </div>
          <NuxtTurnstile class="mt-24px" v-if="!!affcode" v-model="turnstileCallbackToken" :options="{ theme: 'light' }" />
          <GoogleLoginButton v-if="showLoginBtn" ref="googleLoginBtn" :redirect="redirect" :affcode="affcode" />
        </div>
      </div>
    </div>
    <div style="flex: 2"></div>
  </div>
</template>

<script lang="ts" setup>
import GoogleLoginButton from '~/components/GoogleLoginButton.vue'

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
</script>

<style lang="scss" scoped>
.login {
  --style: w-screen h-screen flex flex-(col wrap) items-center justify-between bg-gradient-to-br from-#f8fffc to-#e6fff3;
  .content {
    --style: mt-5;

    .login-view {
      --style: 'min-w-md max-md:(min-w-auto) p-10 border-rounded-8px select-none relative';

      .content {
        --style: flex flex-col z-1 items-center relative;

        .title {
          --style: font-bold text-(28px #1f1f1f) line-height-42px;
        }

        .subtitle {
          --style: mt-48px text-(16px #333333) line-height-22px;
        }

        // eslint-disable-next-line vue-scoped-css/no-unused-selector
        .google-login-button {
          --style: mt-24px;
        }
      }
    }
  }
}
</style>
