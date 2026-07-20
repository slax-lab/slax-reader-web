<template>
  <div class="login-modal" :class="{ appear }" @click="closeModal">
    <Transition name="modal" @after-leave="onAfterLeave">
      <div class="modal-shell" v-show="appear" @click.stop>
        <button class="modal-close" type="button" aria-label="close" @click="closeModal">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        <!-- 与 /login 页 LoginView 同款重设计卡片；modal 走独立 bootloader app（无全局 $t / router /
             NuxtLink），故此处自包含实现：手动 t 助手 + 显式引入登录按钮 + ToS 用原生 <a>。 -->
        <div class="auth-card">
          <div class="auth-logo">
            <img src="@images/icon-logo-login.png" :alt="t('common.app.name')" />
          </div>

          <h1 class="auth-title">{{ t('common.app.name') }}</h1>
          <p class="auth-subtitle">{{ t('component.login_view.title') }}</p>

          <div class="auth-btns">
            <GoogleLoginButton :redirect="redirect" />
            <AppleLoginButton :redirect="redirect" />
          </div>

          <p class="auth-tos">
            {{ t('component.login_view.tos_prefix') }}
            <a href="/terms">{{ t('docs.title.terms') }}</a>
            {{ t('component.login_view.tos_and') }}
            <a href="/privacy">{{ t('docs.title.privacy') }}</a>
          </p>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import AppleLoginButton from '#layers/core/app/components/AppleLoginButton.vue'
import GoogleLoginButton from '#layers/core/app/components/GoogleLoginButton.vue'

defineProps({
  redirect: {
    type: String,
    required: true
  }
})

const emits = defineEmits(['close', 'dismiss', 'success'])

const isLocked = useScrollLock(window)
const appear = ref(false)

isLocked.value = true

onMounted(() => {
  setTimeout(() => {
    appear.value = true
  })
})

const closeModal = () => {
  appear.value = false
}

const onAfterLeave = () => {
  isLocked.value = false
  emits('dismiss')
}

// bootloader app 无全局 $i18n 注入，经 useNuxtApp 显式取 t（与其它 modal / 登录按钮一致）
const t = (text: string) => useNuxtApp().$i18n.t(text)
</script>

<style lang="scss" scoped>
/* ── Overlay ── */
.login-modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: transparent;
  transition: background var(--slax-dur-normal);

  &.appear {
    background: color-mix(in srgb, var(--slax-text) 22%, transparent);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
}

/* ── Shell（承载定位 + 关闭按钮） ── */
.modal-shell {
  position: relative;
  width: min(420px, 100%);
  user-select: none;
}

.modal-close {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  border-radius: var(--slax-radius-sm);
  color: var(--slax-text-light);
  cursor: pointer;
  transition: all var(--slax-dur-normal);

  &:hover {
    background: var(--slax-surface);
    color: var(--slax-text);
  }
}

/* ── Auth card（与 LoginView 同款视觉） ── */
.auth-card {
  width: 100%;
  padding: 40px 36px 32px;
  text-align: center;
  background: var(--slax-surface-solid);
  border: 1px solid var(--slax-border);
  border-radius: var(--slax-radius);
  box-shadow: var(--slax-shadow-warm);

  @media (max-width: 540px) {
    padding: 28px 20px 24px;
  }
}

.auth-logo {
  width: 88px;
  height: 88px;
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    display: block;
  }

  @media (max-width: 540px) {
    width: 72px;
    height: 72px;
    margin-bottom: 16px;
  }
}

.auth-title {
  margin: 0 0 12px;
  font-family: var(--slax-font-serif);
  font-weight: 600;
  font-size: 28px;
  letter-spacing: -0.01em;
  line-height: 1.2;
  color: var(--slax-text);

  @media (max-width: 540px) {
    font-size: 24px;
  }
}

.auth-subtitle {
  margin: 0 0 28px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--slax-text-muted);

  @media (max-width: 540px) {
    font-size: 13px;
    margin-bottom: 24px;
  }
}

.auth-btns {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.auth-tos {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: var(--slax-text-light);

  a {
    color: var(--slax-text-muted);
    text-decoration: underline;
    text-underline-offset: 2px;
    text-decoration-color: var(--slax-border-strong);
    transition: all var(--slax-dur-fast);

    &:hover {
      color: var(--slax-accent);
      text-decoration-color: var(--slax-accent);
    }
  }
}

/* ── 进出场动画 ── */
.modal-enter-active,
.modal-leave-active {
  transition: all var(--slax-dur-normal) ease-in-out;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: translateY(-16px);
}
</style>
