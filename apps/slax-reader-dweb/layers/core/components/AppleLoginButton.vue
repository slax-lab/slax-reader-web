<template>
  <button class="apple-login-button" @click="loginClick">
    <div class="i-logos:apple w-20px text-20px" />
    <span>{{ t('component.login_view.apple_login') }}</span>
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
    method: 'apple'
  })

  await login({
    redirect: props.redirect,
    affcode: props.affcode
  })
}

const login = async (params?: { redirect?: string; affcode?: string }) => {
  await auth.requestAppleAuth({ redirect: params?.redirect || props.redirect, affCode: params?.affcode || (props.affcode as string) || '' })
}

defineExpose({
  login
})
</script>

<style lang="scss" scoped>
.apple-login-button {
  --style: 'w-300px h-48px rounded-3xl bg-white border-(1px solid #6a6e8333) flex-center hover:(opacity-90 scale-105) transition-all duration-250';
  & > * {
    --style: 'not-first:ml-8px';
  }

  span {
    --style: text-(15px #1f1f1f) font-bold line-height-18px;
  }
}
</style>
