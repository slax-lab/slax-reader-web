<template>
  <div class="user-info">
    <NuxtLoadingIndicator color="var(--slax-accent)" />

    <!-- 顶栏：固定 56px，毛玻璃背景 -->
    <div class="user-topbar">
      <div class="topbar-inner">
        <button class="back-btn" @click="navigateToBookmarks">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>{{ $t('component.search_header.back') }}</span>
        </button>
        <span class="topbar-logo">{{ $t('common.app.name') }}</span>
      </div>
    </div>

    <div class="content">
      <Transition name="opacity" mode="out-in">
        <div class="detail" v-if="!loading" key="content">
          <!-- 语言设置卡片 -->
          <div class="settings-card">
            <div class="settings-row" v-if="true">
              <span class="settings-label">{{ $t('page.user.language') }}</span>
              <OptionsBar :options="languageOptions.map(option => option.name)" :defaultSelectedIndex="languageOptionIndex" @option-selected="localeSelect" />
            </div>
            <div class="settings-divider" v-if="userInfo" />
            <div class="settings-row" v-if="userInfo">
              <div class="settings-label-group">
                <AILanguageTips />
                <span class="settings-label">{{ $t('page.user.ai_response_language') }}</span>
              </div>
              <OptionsBar :options="aiLanguageOptions.map(option => option.name)" :defaultSelectedIndex="aiLanguageOptionIndex" @option-selected="aiResponseLanguageSelect" />
            </div>
          </div>

          <!-- 个人信息卡片 -->
          <div class="settings-card">
            <div class="section-title">{{ $t('page.user.personal_info') }}</div>
            <div class="personal">
              <img class="avatar" :src="userInfo?.avatar || avatarUrl" />
              <div class="personal-text">
                <span class="username">{{ userInfo?.name }}</span>
                <span class="email">{{ userInfo?.email }}</span>
              </div>
            </div>
          </div>

          <!-- 第三方绑定（UserRelatedInfoSection 自带 .settings-card） -->
          <UserRelatedInfoSection v-if="userInfo" :user-info="userInfo" @update="getUserDetailInfo" />

          <!-- 导入（UserImportSection 自带 .settings-card） -->
          <UserImportSection />

          <!-- 帮助与支持卡片 -->
          <div class="settings-card">
            <div class="section-title">{{ $t('page.user.help_and_support') }}</div>
            <div class="support">
              <NavigateStyleButton :title="$t('page.user.telegram_channel')" @action="navigateToTelegramChannel" />
            </div>
          </div>

          <!-- 删除账号（不加 settings-card，保持原样） -->
          <UserDeleteAccountSection v-if="userInfo" />
        </div>
        <UserPageSkeleton v-else key="skeleton" />
      </Transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import NavigateStyleButton from '#layers/core/app/components/NavigateStyleButton.vue'
import OptionsBar from '#layers/core/app/components/OptionsBar.vue'
import AILanguageTips from '#layers/core/app/components/Tips/AILanguageTips.vue'
import UserDeleteAccountSection from '#layers/core/app/components/UserDeleteAccountSection.vue'
import UserImportSection from '#layers/core/app/components/UserImportSection.vue'
import UserPageSkeleton from '#layers/core/app/components/UserPageSkeleton.vue'

import { getPreferredLanguage, isSlaxReaderApp } from '../utils/environment'

import { RESTMethodPath } from '@commons/types/const'
import { type UserDetailInfo } from '@commons/types/interface'
import Toast, { ToastType } from '#layers/core/app/components/Toast'
import { useUserStore } from '#layers/core/app/stores/user'

const { t, locale } = useI18n()
const userStore = useUserStore()

const { start, finish } = useLoadingIndicator({
  duration: 5000,
  throttle: 200,
  estimatedProgress: (duration, elapsed) => (2 / Math.PI) * 100 * Math.atan(((elapsed / duration) * 100) / 50)
})

const avatarUrl = new URL('@images/user-default-avatar.png', import.meta.url).href
const userInfo = ref<UserDetailInfo>()
const loading = ref(true)

const languageOptions = computed<{ name: string; value: string }[]>(() => [
  {
    name: t('page.user.language_en'),
    value: 'en'
  },
  {
    name: t('page.user.language_zh'),
    value: 'zh'
  }
])

const aiLanguageOptions = computed<{ name: string; value: string }[]>(() => [
  {
    name: t('page.user.language_en'),
    value: 'en'
  },
  {
    name: t('page.user.language_zh'),
    value: 'zh'
  }
])

const preferredLang = isSlaxReaderApp() ? getPreferredLanguage() : undefined

if (!preferredLang && userStore.currentLocale !== locale.value) {
  userStore.changeLocale(locale.value)
}

const alertParams = (() => {
  const route = useRoute()
  const errorAlert = route.query.error_alert

  if (errorAlert) {
    const query = { ...route.query }
    delete query.error_alert

    navigateTo(
      {
        path: route.path,
        query
      },
      {
        replace: true
      }
    )

    Toast.showToast({
      text: String(errorAlert),
      type: ToastType.Error
    })
  }

  return errorAlert
})()

useHead({
  title: `${t('component.user_operate_icon.personal_info')} - Slax Reader`
})

onMounted(async () => {
  try {
    analyticsLog({
      event: 'setting_view'
    })
  } catch (e) {}

  start()
  await getUserDetailInfo()
  finish()
})

const languageOptionIndex = computed(() => {
  return languageOptions.value.findIndex(option => option.value === userStore.currentLocale) || 0
})

const aiLanguageOptionIndex = computed(() => {
  const aiLang = userInfo.value?.ai_lang
  if (!aiLang) return 0

  const mainLang = getPreferredLanguage(aiLang)
  const index = aiLanguageOptions.value.findIndex(option => option.value === mainLang)
  return index !== -1 ? index : 0
})

const getUserDetailInfo = async () => {
  const res = await request().get<UserDetailInfo>({
    url: RESTMethodPath.USER_INFO
  })

  userInfo.value = res
  loading.value = false
}

const navigateToBookmarks = () => {
  navigateTo('/bookmarks', {
    replace: true
  })
}

const navigateToTelegramChannel = () => {
  window.open(`https://t.me/slax_app`)
}

const aiResponseLanguageSelect = async (index: number) => {
  const locale = aiLanguageOptions.value[index]
  if (!locale) return

  await request().post({
    url: RESTMethodPath.USER_INFO_SETTING,
    body: {
      key: 'ai_lang',
      value: locale.value
    }
  })
  await getUserDetailInfo()
}

const localeSelect = (index: number) => {
  const option = languageOptions.value[index]
  if (!option) return
  userStore.changeLocale(option.value)
}
</script>

<style lang="scss" scoped>
.user-info {
  --style: w-full relative flex justify-center items-start pb-88px;
}

// 顶栏：固定 56px，毛玻璃
.user-topbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--slax-topbar-bg);
  backdrop-filter: var(--slax-blur);
  border-bottom: 1px solid var(--slax-border);
  z-index: 100;
}

.topbar-inner {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  padding: 6px 0;
  color: var(--slax-text-muted);
  font-size: var(--slax-fs-aux);
  font-family: inherit;
  cursor: pointer;
  transition: color var(--slax-dur-normal);

  &:hover {
    color: var(--slax-text);
  }

  span {
    font-weight: 500;
  }
}

.topbar-logo {
  font-family: var(--slax-font-serif);
  font-size: var(--slax-fs-brand);
  font-weight: 500;
  color: var(--slax-text);
  letter-spacing: -0.02em;
}

// 内容区：顶部留出顶栏高度 + 额外间距
.content {
  width: 100%;
  max-width: 672px;
  padding: calc(var(--slax-header-height) + 32px) 24px 88px;

  @media (max-width: 768px) {
    padding-left: 16px;
    padding-right: 16px;
  }
}

// 通用卡片样式
.settings-card {
  background: var(--slax-surface);
  border: 1px solid var(--slax-border);
  border-radius: var(--slax-radius);
  box-shadow: inset 0 1px 0 var(--slax-inset-hi);
  padding: 24px;
  margin-top: 16px;

  &:first-child {
    margin-top: 0;
  }
}

.detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// Section 标题
.section-title {
  font-family: var(--slax-font-serif);
  font-size: var(--slax-fs-h2);
  font-weight: 500;
  color: var(--slax-text);
  line-height: 1.4;
  margin-bottom: 20px;
  user-select: none;
}

// 语言设置行
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  position: relative;
  z-index: 1;

  // 第一行下拉需要浮在第二行之上
  &:first-child {
    z-index: 2;
  }
}

.settings-label {
  font-size: var(--slax-fs-aux);
  color: var(--slax-text-muted);
  line-height: 1.5;
}

.settings-label-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.settings-divider {
  height: 1px;
  background: var(--slax-border);
  margin: 8px 0;
}

// 个人信息区
.personal {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.personal-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.username {
  font-family: var(--slax-font-serif);
  font-size: var(--slax-fs-card);
  color: var(--slax-text);
  font-weight: 600;
  line-height: 1.45;
}

.email {
  font-size: var(--slax-fs-aux);
  color: var(--slax-text-light);
  line-height: 1.5;
}

// 帮助支持
.support {
  margin-top: 16px;
}
</style>

<!-- eslint-disable vue-scoped-css/enforce-style-type -->
<style lang="scss">
/* user 页专属背景：override body 背景色和氛围渐变，随主题切换 */
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
