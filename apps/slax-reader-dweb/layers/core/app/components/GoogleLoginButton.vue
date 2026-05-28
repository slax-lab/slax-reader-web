<template>
  <button class="google-login-button" @click="loginClick">
    <div class="i-logos:google-icon text-brand w-20px" />
    <span>{{ t('component.login_view.google_login') }}</span>
  </button>
</template>

<script lang="ts" setup>
const t = (text: string) => {
  return useNuxtApp().$i18n.t(text)
}

const props = defineProps({
  redirect: {
    type: String,
    require: false,
    default: ''
  },
  affcode: {
    type: String,
    required: false
  }
})

const auth = useAuth()

const loginClick = async () => {
  analyticsLog({
    event: 'user_login_start',
    method: 'google'
  })

  await login({
    redirect: props.redirect,
    affcode: props.affcode
  })
}

const login = async (params?: { redirect?: string; affcode?: string }) => {
  await auth.requestAuth({ redirect: params?.redirect || props.redirect, affCode: params?.affcode || (props.affcode as string) || '' })
}

defineExpose({
  login
})
</script>

<style lang="scss" scoped>
.google-login-button {
  --style: 'w-300px h-48px rounded-3xl bg-white border-(1px solid #6a6e8333) flex-center hover:(opacity-90 scale-105) transition-all duration-normal';
  & > * {
    --style: 'not-first:ml-8px';
  }

  span {
    --style: text-(meta txt) font-bold line-height-18px;
  }
}
</style>
