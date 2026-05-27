<template>
  <div class="share-popover-wrap" ref="wrapEl">
    <button class="share-btn" :class="{ active: isOpen }" :title="$t('common.operate.share')" @click.stop="toggle">
      <!-- 三圆点连线 share icon -->
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="13" cy="3" r="2" stroke="currentColor" stroke-width="1.5" />
        <circle cx="3" cy="8" r="2" stroke="currentColor" stroke-width="1.5" />
        <circle cx="13" cy="13" r="2" stroke="currentColor" stroke-width="1.5" />
        <line x1="4.89" y1="6.93" x2="11.11" y2="3.93" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        <line x1="4.89" y1="9.07" x2="11.11" y2="12.07" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>
    <Transition name="popover">
      <div v-if="isOpen" class="share-popover" v-on-click-outside="close">
        <button class="popover-item" @click="copyLink">
          <span class="item-icon">🔗</span>
          <span>{{ $t('common.operate.copy_link') }}</span>
        </button>
        <button class="popover-item" @click="shareTwitter">
          <span class="item-icon">𝕏</span>
          <span>{{ $t('common.operate.share_twitter') }}</span>
        </button>
        <div class="popover-divider" />
        <div class="popover-toggle-row">
          <span class="toggle-label">{{ $t('page.share_detail.marks_visible') }}</span>
          <button class="toggle-btn" :class="{ on: marksVisible }" :aria-pressed="marksVisible" @click="marksVisible = !marksVisible">
            <span class="toggle-knob" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { vOnClickOutside } from '@vueuse/components'
import Toast, { ToastType } from '#layers/core/app/components/Toast'
import { useExclusivePopover } from '#layers/core/app/composables/useExclusivePopover'

const { t } = useI18n()

const { isOpen, toggle, close } = useExclusivePopover()
const marksVisible = ref(true)

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(location.href)
    Toast.showToast({ text: t('common.tips.copy_success'), type: ToastType.Success })
  } catch {
    Toast.showToast({ text: t('common.tips.copy_failed'), type: ToastType.Error })
  }
  close()
}

const shareTwitter = () => {
  const url = `https://x.com/intent/tweet?url=${encodeURIComponent(location.href)}`
  window.open(url, '_blank', 'noopener,noreferrer')
  close()
}
</script>

<style lang="scss" scoped>
.share-popover-wrap {
  --style: relative;
}

.share-btn {
  --style: 'w-28px h-28px flex items-center justify-center rounded-sm cursor-pointer transition-colors duration-fast';
  color: var(--slax-text-light);
  background: transparent;

  &:hover,
  &.active {
    color: var(--slax-text);
    background: var(--slax-accent-bg);
  }
}

.share-popover {
  --style: absolute z-200 top-full right-0 mt-8px;
  min-width: 200px;
  padding: 4px;
  background: var(--slax-surface-solid);
  border: 1px solid var(--slax-border);
  border-radius: var(--slax-radius-sm);
  box-shadow: var(--slax-shadow-warm);

  .popover-item {
    --style: 'w-full px-16px py-10px flex items-center gap-10px rounded-sm cursor-pointer transition-colors duration-fast text-left';
    color: var(--slax-text);
    font-size: var(--slax-fs-aux);
    background: transparent;

    &:hover {
      background: var(--slax-accent-bg);
    }

    .item-icon {
      font-size: 14px;
      width: 20px;
      text-align: center;
    }
  }

  .popover-divider {
    --style: my-4px mx-8px;
    height: 1px;
    background: var(--slax-border);
  }

  .popover-toggle-row {
    --style: px-16px py-10px flex items-center justify-between gap-12px;

    .toggle-label {
      font-size: var(--slax-fs-aux);
      color: var(--slax-text-muted);
    }

    .toggle-btn {
      --style: relative flex-none w-32px h-18px rounded-full cursor-pointer transition-colors duration-normal;
      background: var(--slax-border);

      &.on {
        background: var(--slax-accent);
      }

      .toggle-knob {
        --style: absolute top-2px w-14px h-14px rounded-full transition-transform duration-normal;
        left: 2px;
        background: white;
      }
    }

    .toggle-btn.on .toggle-knob {
      transform: translateX(14px);
    }
  }
}

.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.popover-enter-active,
.popover-leave-active {
  --style: transition-all duration-fast ease-in-out;
}
</style>
