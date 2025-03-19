<template>
  <section>
    <div class="title">{{ $t('page.user.third_party_binding') }}</div>
    <div class="info">
      <div class="binding">
        <NavigateStyleButton v-if="!isEnablePlaform('telegram')" :title="$t('page.user.telegram')" @action="bindTelegram" />
        <p v-else>Telegram: {{ getPlatformAccount('telegram') }}</p>
      </div>
    </div>
  </section>
</template>

<script lang="ts" setup>
import NavigateStyleButton from '#layers/core/components/NavigateStyleButton.vue'

import { RESTMethodPath } from '@commons/types/const'
import type { BindedPlatformInfo, UserDetailInfo } from '@commons/types/interface'

const emits = defineEmits(['update'])
const props = defineProps({
  userInfo: {
    type: Object as PropType<UserDetailInfo>,
    required: true
  }
})

const isEnablePlaform = (platform: string) => {
  return props.userInfo?.platform?.some((item: BindedPlatformInfo) => item.platform === platform)
}

const getPlatformAccount = (platform: string) => {
  return props.userInfo?.platform?.find((item: BindedPlatformInfo) => item.platform === platform)?.user_name || ''
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

    setTimeout(() => {
      emits('update')
    }, 10000)
  }
}
</script>

<style lang="scss" scoped>
section {
  --style: 'mt-48px not-first:mt-60px';
  .title {
    --style: font-600 text-(24px #0f1419) line-height-33px text-left select-none;
  }

  .info {
    .binding {
      --style: mt-24px;
    }
  }
}
</style>
