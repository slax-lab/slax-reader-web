<template>
  <div class="edit-name-modal" :class="{ appear }" @click="closeModal">
    <Transition name="modal" @after-leave="onAfterLeave">
      <div class="modal-content" v-show="appear" @click.stop>
        <div class="header">
          <button class="close" @click="closeModal">
            <img src="~/assets/images/button-dialog-close.png" />
          </button>
        </div>
        <div class="content">
          <span>{{ t('component.login_view.share_page_login_tips') }}</span>
        </div>
        <div class="bottom">
          <GoogleLoginButton :redirect="redirect" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import GoogleLoginButton from '~/components/GoogleLoginButton.vue'

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

const t = (text: string) => {
  return useNuxtApp().$i18n.t(text)
}
</script>

<style lang="scss" scoped>
.edit-name-modal {
  --style: fixed inset-0 z-100 bg-transparent flex-center transition-colors duration-250;
  &.appear {
    --style: bg-#0f141999;
  }
}

.modal-content {
  --style: bg-#f5f5f3 rounded-2 p-24px w-480px select-none mb-10 relative overflow-hidden;

  .header {
    --style: flex justify-end items-center;

    button {
      --style: w-16px h-16px;
      img {
        --style: w-full;
      }
    }
  }

  .content {
    --style: mt-26px flex flex-col items-center justify-stretch;
    span {
      --style: text-(16px #333) line-height-24px;
    }
  }

  .bottom {
    --style: mt-40px pb-40px flex-center;
  }
}

.modal-leave-to,
.modal-enter-from {
  --style: opacity-0 -translate-y-25px;
}

.modal-enter-active,
.modal-leave-active {
  --style: transition-all duration-250 ease-in-out;
}
</style>
