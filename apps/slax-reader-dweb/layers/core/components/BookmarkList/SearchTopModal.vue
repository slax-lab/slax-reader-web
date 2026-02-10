<template>
  <Transition name="top-modals">
    <div class="bookmark-list-top-modals" v-show="show" v-on-click-outside="closeModal">
      <div class="search-modal">
        <div class="title">{{ $t('common.operate.search') }}</div>
        <div class="input-bar-wrapper">
          <InputBar
            ref="inputbar"
            v-model:text="searchText"
            :confirm-title="$t('common.operate.search')"
            :confirm-icon="InputConfirmIcon.Search"
            :placeholder="$t('component.search_header.placeholder')"
            :disabled="searchText.length === 0"
            @confirm="topModalClick"
          />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import InputBar, { InputConfirmIcon } from '#layers/core/components/InputBar.vue'

import { vOnClickOutside } from '@vueuse/components'

const show = defineModel('show')
const emits = defineEmits(['search'])

const searchText = ref('')
const inputbar = ref<InstanceType<typeof InputBar>>()

watch(
  () => show.value,
  value => {
    if (value) {
      nextTick(() => {
        inputbar.value?.focus()
      })
    }
  }
)

const topModalClick = async () => {
  emits('search', searchText.value)
  closeModal()
  nextTick(() => {
    searchText.value = ''
  })

  try {
    analyticsLog({
      event: 'bookmark_list_search'
    })
  } catch (error) {
    console.error('Analytics log error:', error)
  }
}

const closeModal = () => {
  show.value = false
}
</script>

<style lang="scss" scoped>
.bookmark-list-top-modals {
  --modal-height: 170px;
  --style: 'absolute top-full left-0 right-0 h-[var(--modal-height)] shadow-[0px_30px_60px_0px_#00000014] rounded-b-8px overflow-hidden max-md:(fixed top-104px left-0 w-full)';
  .search-modal {
    --style: 'absolute bottom-0 left-0 w-full h-[var(--modal-height)] bg-#fff pt-24px pb-48px px-54px ';

    .title {
      --style: text-(18px #333) line-height-25px font-bold;
    }

    .input-bar-wrapper {
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
