<template>
  <button class="apple-login-button" @click="loginClick">
    <div class="i-logos:apple text-brand w-20px" />
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
  --style: 'w-300px h-48px flex-center';
  background: var(--slax-surface-solid);
  border: 1px solid var(--slax-border);
  border-radius: var(--slax-radius-sm);
  cursor: pointer;
  transition: all var(--slax-dur-normal);

  & > * {
    --style: 'not-first:ml-8px';
  }

  span {
    font-size: var(--slax-fs-meta);
    font-weight: 500;
    color: var(--slax-text);
    line-height: 18px;
  }

  &:hover {
    background: var(--slax-surface);
    border-color: color-mix(in srgb, var(--slax-text-light) 40%, var(--slax-border));
    transform: translateY(-1px);
    box-shadow: var(--slax-shadow-sm);
  }
}
</style>
