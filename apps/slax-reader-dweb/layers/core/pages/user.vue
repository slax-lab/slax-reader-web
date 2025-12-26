<template>
  <div class="user-info">
    <NuxtLoadingIndicator color="#16b998" />
    <div class="content responsive-width">
      <div class="header">
        <button class="app-name" @click="navigateToBookmarks">{{ $t('common.app.name') }}</button>
      </div>
      <div class="detail">
        <div class="options-select">
          <div class="locale">
            <span class="title">{{ $t('page.user.language') }}</span>
            <OptionsBar :options="languageOptions.map(option => option.name)" :defaultSelectedIndex="languageOptionIndex" @option-selected="localeSelect" />
          </div>
          <div class="ai-locale" v-if="userInfo">
            <AILanguageTips />
            <span class="title">{{ $t('page.user.ai_response_language') }}</span>
            <OptionsBar :options="aiLanguageOptions.map(option => option.name)" :defaultSelectedIndex="aiLanguageOptionIndex" @option-selected="aiResponseLanguageSelect" />
          </div>
        </div>
        <section>
          <div class="title">{{ $t('page.user.personal_info') }}</div>
          <div class="info" v-if="!loading">
            <div class="personal">
              <div class="introduction">
                <img :src="userInfo?.avatar || avatarUrl" />
                <div class="text">
                  <span class="username">{{ userInfo?.name }}</span>
                  <span class="email">{{ userInfo?.email }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <UserRelatedInfoSection v-if="userInfo" :user-info="userInfo" @update="getUserDetailInfo" />
        <UserImportSection />
        <section>
          <div class="title">{{ $t('page.user.help_and_support') }}</div>
          <div class="info">
            <div class="support">
              <NavigateStyleButton :title="$t('page.user.telegram_channel')" @action="navigateToTelegramChannel" />
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import NavigateStyleButton from '#layers/core/components/NavigateStyleButton.vue'
import OptionsBar from '#layers/core/components/OptionsBar.vue'
import AILanguageTips from '#layers/core/components/Tips/AILanguageTips.vue'
import UserImportSection from '#layers/core/components/UserImportSection.vue'

import { RESTMethodPath } from '@commons/types/const'
import { type UserDetailInfo } from '@commons/types/interface'
import { useUserStore } from '#layers/core/stores/user'

const { t, locale } = useI18n()
const userStore = useUserStore()

const { progress, isLoading, start, finish, clear } = useLoadingIndicator({
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

// 检查当前url是否有lang参数
const haveLangParam = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('lang')

if (!haveLangParam && userStore.currentLocale !== locale.value) {
  userStore.changeLocale(locale.value)
}

useHead({
  title: `${t('component.user_operate_icon.personal_info')} - Slax Reader`
})
onMounted(async () => {
  start()
  await getUserDetailInfo()
  finish()
})

const languageOptionIndex = computed(() => {
  return languageOptions.value.findIndex(option => option.value === userStore.currentLocale) || 0
})

const aiLanguageOptionIndex = computed(() => {
  return aiLanguageOptions.value.findIndex(option => option.value === userInfo.value?.ai_lang) || 0
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
  userStore.changeLocale(option.value)
}
</script>

<style lang="scss" scoped>
.user-info {
  --style: w-full relative flex justify-center items-start bg-#fcfcfc pb-88px;

  .content {
    --style: 'relative min-h-screen flex-1 max-md:(pb-10 !w-full) transition-transform duration-200';
    .header {
      --style: h-11 border-b-(1px solid #ecf0f5) flex justify-between items-center;

      .app-name {
        --style: text-(16px #16b998) font-bold line-height-22px;
      }
    }

    .detail {
      .options-select {
        --style: flex;

        & > * {
          --style: 'not-first:ml-48px';
        }

        .locale,
        .ai-locale {
          --style: mt-24px flex items-center justify-start;

          .title {
            --style: text-(14px #333) line-height-20px mr-16px;
          }

          // eslint-disable-next-line vue-scoped-css/no-unused-selector
          div + .title {
            --style: ml-4px;
          }
        }
      }
      section {
        --style: 'not-first:mt-60px';
        .title {
          --style: font-600 text-(24px #0f1419) line-height-33px text-left select-none;
        }

        .info {
          .personal {
            --style: mt-40px flex justify-between items-center;

            .introduction {
              --style: flex items-center;

              img {
                --style: w-64px h-64px object-contain rounded-8px;
              }

              .text {
                --style: ml-24px flex flex-col;

                .username {
                  --style: text-(18px #0f1419) line-height-25px font-600;
                }

                .email {
                  --style: mt-4px text-(14px #999) line-height-20px;
                }
              }
            }
          }

          .support {
            --style: mt-24px;
          }
        }
      }
    }
  }

  .responsive-width {
    --style: 'w-2xl max-w-2xl max-md:(pl-5 pr-5)';
  }
}
</style>
