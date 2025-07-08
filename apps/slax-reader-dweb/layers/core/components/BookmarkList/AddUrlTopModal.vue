<template>
  <Transition name="top-modals">
    <div class="bookmark-list-top-modals" v-show="show" v-on-click-outside="closeModal">
      <div class="add-url-modal">
        <div class="title">{{ $t('component.add_url_top_modal.add_url.title') }}</div>
        <div class="add-url-input">
          <InputBar
            ref="urlInput"
            v-model:text="addUrlText"
            :confirm-title="$t('component.add_url_top_modal.add_url.button')"
            :confirm-icon="InputConfirmIcon.Tick"
            :placeholder="$t('component.add_url_top_modal.add_url.placeholder')"
            :loading="searchModalLoading"
            :disabled="!addUrlButtonEnable"
            @confirm="topModalClick"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import InputBar, { InputConfirmIcon } from '#layers/core/components/InputBar.vue'

import { RESTMethodPath } from '@commons/types/const'
import { vOnClickOutside } from '@vueuse/components'

const show = defineModel('show')
const emits = defineEmits(['addUrlSuccess'])

const urlInput = ref<InstanceType<typeof InputBar>>()
const addUrlText = ref('')
const searchModalLoading = ref(false)

watch(
  () => show.value,
  value => {
    if (value) {
      nextTick(() => {
        urlInput.value?.focus()
      })
    }
  }
)

const addUrlButtonEnable = computed(() => {
  if (!addUrlText.value) return false
  const isHttp = addUrlText.value.startsWith('http://') || addUrlText.value.startsWith('https://')
  return isHttp
})

const topModalClick = async () => {
  searchModalLoading.value = true

  await request.post<{ bookmark_id: number; status: string }>({
    url: RESTMethodPath.ADD_URL_BOOKMARK,
    body: {
      target_url: addUrlText.value
    }
  })

  searchModalLoading.value = false
  show.value = false

  emits('addUrlSuccess', addUrlText.value)
  addUrlText.value = ''
}

const closeModal = () => {
  show.value = false
}
</script>

<style lang="scss" scoped>
.bookmark-list-top-modals {
  --modal-height: 170px;
  --style: 'absolute top-full left-0 right-0 h-[var(--modal-height)] shadow-[0px_30px_60px_0px_#00000014] rounded-b-8px overflow-hidden max-md:(hidden)';
  .add-url-modal {
    --style: 'absolute bottom-0 left-0 w-full h-[var(--modal-height)] bg-#fff pt-24px pb-48px px-54px ';

    .title {
      --style: text-(18px #333) line-height-25px font-bold;
    }

    .add-url-input {
      --style: mt-24px;
    }
  }
}

.top-modals-enter-active,
.top-modals-leave-active {
  transition: all 0.25s;
}

.top-modals-enter-from,
.top-modals-leave-to {
  --style: '!h-0 !opacity-0';
}
</style>
