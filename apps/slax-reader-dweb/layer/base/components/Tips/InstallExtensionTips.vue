<template>
  <div class="install-extension-tips">
    <Transition name="tips">
      <div v-show="isAppeared" class="extension">
        <button class="close" @click="closeClick">
          <img src="@images/button-dialog-close.png" />
        </button>
        <span class="title">{{ $t('component.install_extension_tips.title') }}</span>
        <img class="guide" src="@images/guide-tips-extension.png" alt="" />
        <span class="descript">{{ $t('component.install_extension_tips.descript') }}</span>
        <button class="install" @click="installClick">
          <span>{{ $t('component.install_extension_tips.install') }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { useUserStore } from '#layers/base/stores/user'

const isAppeared = ref(false)
const userStore = useUserStore()

onMounted(() => {
  const dom = document.querySelector('slax-reader-modal')
  if (!dom) {
    const shouldShow = userStore.showCloseInstallExtTips
    isAppeared.value = shouldShow
  }
})

const closeClick = () => {
  userStore.updateCloseInstallExtTipsDate()
  isAppeared.value = false
}

const installClick = () => {
  window.open('https://chromewebstore.google.com/detail/slax-reader/gdnhaajlomjkhahnmiijphnodkcfikfd')
}
</script>

<style lang="scss" scoped>
.install-extension-tips {
  .extension {
    --style: 'relative w-180px pt-28px px-10px pb-16px bg-gradient-to-b from-#E0FFF1 to-#FCFFFD rounded-8px border-(1px solid #bef6e4) flex flex-col';

    .close {
      --style: 'absolute right-12px top-12px w-16px h-16px flex-center hover:(scale-103 opacity-90) active:(scale-105) transition-all duration-250';
      img {
        --style: w-full select-none;
      }
    }

    .title {
      --style: text-(15px #0f1419) line-height-21px font-600;
    }

    .guide {
      --style: mt-10px w-full object-fit;
    }

    .descript {
      --style: mt-16px text-(12px #333333cc) line-height-17px;
    }

    .install {
      --style: 'mt-24px bg-#16B998 w-full py-7px rounded-6px hover:(bg-#14A698) active:(scale-105) transition-all duration-250';
      span {
        --style: text-(#fff 13px) line-height-16px;
      }
    }
  }
}

.tips-enter-active,
.tips-leave-active {
  transition: all 0.4s;
}

.tips-enter-from,
.tips-leave-to {
  opacity: 0;
  transform: translateY(20px);
  filter: blur(1rem);
}
</style>
