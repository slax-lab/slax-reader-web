<template>
  <div class="user-info">
    <NuxtLoadingIndicator color="#16b998" />
    <div class="content responsive-width">
      <div class="header">
        <button class="app-name" @click="navigateToBookmarks">{{ $t('common.app.name') }}</button>
      </div>
      <div class="detail">
        <div class="locale">
          <span class="title">{{ $t('page.user.language') }}</span>
          <div class="options">
            <div class="option" v-for="(radio, index) in radios" :key="radio.value">
              <button class="radio" :class="{ selected: index === radioIndex }" @click="localeSelect(radio.value)"></button>
              <span>{{ radio.name }}</span>
            </div>
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
        <AsyncUserSubscribeSection v-if="userInfo" :user-info="userInfo" class="section" />
        <section>
          <div class="title">{{ $t('page.user.third_party_binding') }}</div>
          <div class="info">
            <div class="binding">
              <NavigateStyleButton v-if="!isEnablePlaform('telegram')" :title="$t('page.user.telegram')" @action="bindTelegram" />
              <p v-else>Telegram: {{ getPlatformAccount('telegram') }}</p>
            </div>
          </div>
        </section>
        <AsyncUserCollectionSections v-if="userInfo" :user-info="userInfo" @update="getUserDetailInfo" />
        <section>
          <div class="title">{{ $t('page.user.import_third_party_data') }}</div>
          <div class="info">
            <div class="import">
              <div class="import-description">
                <p>{{ `${$t('page.user.import_description')}\n\n${$t('page.user.import_note1')}\n${$t('page.user.import_note2')}` }}</p>
              </div>
              <div class="omnivore-section">
                <ClientOnly>
                  <NavigateStyleButton :title="`${$t('page.user.import_third_party_data')} Omnivore`" @action="omnivoreClick" />
                </ClientOnly>
                <button class="inline" @click="popupImportProgress">
                  <span>{{ $t('page.user.view_import_progress') }}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
        <section>
          <div class="title">{{ $t('page.user.help_and_support') }}</div>
          <div class="info">
            <div class="support">
              <NavigateStyleButton :title="$t('page.user.telegram_channel')" @action="navigateToTelegramChannel" />
            </div>
          </div>
        </section>
        <ImportProgressModal v-if="showImportProgressModal" @close="showImportProgressModal = false" />
        <ImportLoadingModal v-if="showImportLoadingModal" :progress="importProgress" :text="importText" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import NavigateStyleButton from '#layers/base/components/NavigateStyleButton.vue'
import ImportLoadingModal from '#layers/base/components/ThirdPartyImport/ImportLoadingModal.vue'
import ImportProgressModal from '#layers/base/components/ThirdPartyImport/ImportProgressModal.vue'

import { RESTMethodPath } from '@commons/types/const'
import { type BindedPlatformInfo, type StripeAccountInfo, type UserDetailInfo } from '@commons/types/interface'
import { AsyncUserCollectionSections, AsyncUserSubscribeSection } from '#layers/base/components/isolation/Payment'
import Toast from '#layers/base/components/Toast'
import { useUserStore } from '#layers/base/stores/user'

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
const showImportProgressModal = ref(false)
const showImportLoadingModal = ref(false)
const importProgress = ref(0)
const importText = ref('')
const userStripeAccountInfo = ref<StripeAccountInfo | null>(null)

const radios = computed<{ name: string; value: string }[]>(() => [
  {
    name: t('page.user.language_en'),
    value: 'en'
  },
  {
    name: t('page.user.language_zh'),
    value: 'zh'
  }
])

if (userStore.currentLocale !== locale.value) {
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

const radioIndex = computed(() => {
  return radios.value.findIndex(radio => radio.value === userStore.currentLocale) || 0
})

const getUserDetailInfo = async () => {
  const res = await request.get<UserDetailInfo>({
    url: RESTMethodPath.USER_INFO
  })

  userInfo.value = res
  loading.value = false
  userStripeAccountInfo.value = res?.stripe_connect || null
}

const navigateToBookmarks = () => {
  navigateTo('/bookmarks', {
    replace: true
  })
}

const navigateToTelegramChannel = () => {
  window.open(`https://t.me/slax_app`)
}

const isEnablePlaform = (platform: string) => {
  return userInfo.value?.platform?.some((item: BindedPlatformInfo) => item.platform === platform)
}

const getPlatformAccount = (platform: string) => {
  return userInfo.value?.platform?.find((item: BindedPlatformInfo) => item.platform === platform)?.user_name || ''
}

const omnivoreClick = () => {
  chooseFile('omnivore')
}

const chooseFile = (type: string) => {
  let input = document.createElement('input')
  document.body.appendChild(input)
  input.type = 'file'
  input.id = 'file'
  input.hidden = true
  input.onchange = e => {
    if (e.target) {
      importThirdPartyData(type)
    }
    document.body.removeChild(input)
  }
  input.click()
}

const importThirdPartyData = async (type: string) => {
  const file = document.getElementById('file') as HTMLInputElement
  if (!file.files || file.files.length === 0) {
    console.log('not select file')
    return
  }
  showImportLoadingModal.value = true
  importText.value = 'unzip file...'
  const metadataList = await unzipGetFile(file.files[0], /metadata_[0-9]+_to_[0-9]+.json/)
  if (!metadataList) {
    Toast.showToast({
      text: `file not found or is not ${type} file`
    })
    return
  }

  importText.value = 'upload file...'
  importProgress.value = 20
  // 分批上传
  for (const [idx, metadata] of metadataList.entries()) {
    importText.value = `upload file ${idx + 1} of ${metadataList.length}...`
    await request
      .uploadFile({
        url: RESTMethodPath.IMPORT_THIRD_PARTY_DATA,
        query: {
          type,
          file_type: metadata.type
        },
        fileContent: metadata
      })
      .then(() => {
        importProgress.value += Math.ceil(((idx + 1) / metadataList.length) * 100)
        Toast.showToast({
          text: `import ${type} data success, please wait for a moment`
        })
      })
  }
  showImportLoadingModal.value = false
}

const popupImportProgress = () => {
  showImportProgressModal.value = true
}

const bindTelegram = async () => {
  const resp = await request
    .post<string>({
      url: RESTMethodPath.GET_BIND_LINK,
      body: { platform: 'telegram' }
    })
    .finally(() => {})
  if (!resp) {
    console.log('error')
    return
  } else {
    window.open(resp)
  }
}

const localeSelect = (locale: string) => {
  userStore.changeLocale(locale)
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
      .locale {
        --style: mt-24px flex items-center justify-start;

        .title {
          --style: text-(14px #333) line-height-20px;
        }

        .options {
          --style: ml-20px flex items-center jusitfy-start;

          .option {
            --style: 'flex-center not-first:ml-20px';

            button {
              --style: bg-[url('@images/button-radio-unselect.png')] w-12px h-12px bg-contain;
              &.selected {
                --style: bg-[url('@images/button-radio-selected.png')];
              }
            }

            span {
              --style: ml-8px text-(14px #333) line-height-20px;
            }
          }
        }
      }

      section {
        --style: 'mt-48px not-first:mt-60px';
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

          .binding,
          .support,
          .omnivore-section {
            --style: mt-24px;
          }
        }
      }
    }
  }

  .responsive-width {
    --style: 'w-2xl max-w-2xl max-md:(pl-5 pr-5)';
  }

  .import {
    --style: mt-8px;

    .import-description {
      --style: whitespace-pre-line;

      p {
        --style: text-(14px #333) line-height-22px;
      }
    }

    .omnivore-section {
      --style: flex justify-between items-center;
      button.inline {
        --style: 'text-(14px #5490c2) line-height-20px underline underline-#5490C2 transition-all duration-250 hover:(scale-102) active:(scale-105)';
      }
    }
  }
}
</style>
