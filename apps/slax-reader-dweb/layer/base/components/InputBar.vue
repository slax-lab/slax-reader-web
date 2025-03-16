<template>
  <div class="input-bar">
    <input
      ref="input"
      type="text"
      :class="{ loading: loading }"
      :disabled="loading"
      :placeholder="placeholder"
      v-model="text"
      v-on-key-stroke:Enter="[onKeyDown, { eventName: 'keydown' }]"
    />
    <div class="operate" :class="{ loading: loading, disabled }">
      <button :class="{ loading: loading }" :disabled="disabled" @click="confirmClick">
        <img v-if="confirmIcon === InputConfirmIcon.Tick" src="~/assets/images/tiny-tick-white-icon.png" alt="" />
        <img v-if="confirmIcon === InputConfirmIcon.Search" src="~/assets/images/tiny-search-white-icon.png" alt="" />
        <span>{{ confirmTitle }}</span>
      </button>
      <Transition name="opacity">
        <div class="loading-content" v-show="loading">
          <i class="i-svg-spinners:90-ring text-30px color-#fff"></i>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script lang="ts">
export enum InputConfirmIcon {
  Tick = 'tick',
  Search = 'search'
}
</script>

<script lang="ts" setup>
import { vOnKeyStroke } from '@vueuse/components'

const props = defineProps({
  loading: {
    type: Boolean,
    required: false
  },
  disabled: {
    type: Boolean,
    required: false
  },
  placeholder: {
    type: String,
    required: false
  },
  confirmTitle: {
    type: String,
    required: true
  },
  confirmIcon: {
    type: String,
    required: false
  }
})

const text = defineModel('text')
const input = ref<HTMLInputElement>()

const emits = defineEmits(['confirm'])

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key !== 'Enter' || props.disabled) {
    return
  }

  confirmClick()
}

const confirmClick = () => {
  emits('confirm', text.value)
}

const focus = () => {
  nextTick(() => {
    input.value?.focus()
  })
}

defineExpose({
  focus
})
</script>

<style lang="scss" scoped>
.input-bar {
  --style: w-full rounded-8px h-48px flex overflow-hidden relative;

  input {
    --style: min-w-0 rounded-l-8px flex-1 border-(1px solid #ecf0f5) border-r-none pt-13px px-16px pb-14px text-(15px #333) line-height-21px;
    &::placeholder,
    &::-webkit-input-placeholder {
      --style: text-(15px #999) line-height-21px;
    }
  }

  .operate {
    --style: 'relative bg-#16B998 hover:(bg-#14A698) transition-all duration-250';

    &.loading,
    &.disabled {
      --style: 'bg-#ccc';
    }

    button {
      --style: 'shrink-0 h-full pl-16px pr-20px text-(ellipsis) md:(min-w-100px) active:(scale-105) whitespace-nowrap overflow-hidden flex-center transition-all duration-250';
      img {
        --style: w-24px h-24px;
      }

      span {
        --style: 'text-(18px #fff) line-height-25px max-md:(hidden)';
      }

      img + span {
        --style: ml-5px;
      }

      &.loading {
        --style: opacity-0;
      }
    }

    .loading-content {
      --style: absolute inset-0 flex-center;
    }
  }
}
</style>
