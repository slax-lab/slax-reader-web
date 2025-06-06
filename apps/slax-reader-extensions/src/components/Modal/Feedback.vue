<template>
  <div class="feedback-modal" :class="{ appear }" @click="closeModal">
    <Transition name="modal" @after-leave="onAfterLeave">
      <div class="modal-content" v-show="appear" @click.stop>
        <div class="header">
          <span>{{ $t('component.feedback.title') }}</span>
          <button class="close" @click="closeModal">
            <img src="@/assets/button-dialog-close.png" />
          </button>
        </div>
        <div class="content">
          <div class="title" v-if="props.title">{{ props.title }}</div>
          <textarea v-model="feedback" :placeholder="$t('component.feedback.placeholder')"></textarea>
        </div>
        <div class="bottom">
          <button :class="{ disabled: feedback.length === 0 }" @click="submitFeedback">{{ $t('common.operate.submit') }}</button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { RESTMethodPath } from '@commons/types/const'
import { useScrollLock } from '@vueuse/core'

const props = defineProps({
  reportType: String,
  title: String,
  params: {
    type: Object as PropType<Record<string, string | number>>,
    required: false
  }
})

const emits = defineEmits(['close', 'dismiss'])

const isLocked = useScrollLock(window)
const appear = ref(false)
const feedback = ref('')

isLocked.value = true

onMounted(() => {
  setTimeout(() => {
    appear.value = true
  })
})

const closeModal = () => {
  appear.value = false
}
const submitFeedback = () => {
  if (feedback.value.length === 0) {
    return
  }

  reportFeedbackContent()
}
const reportFeedbackContent = async () => {
  const req = {
    type: props.reportType,
    content: feedback.value,
    ...props.params
  }

  request
    .post({
      url: RESTMethodPath.REPORT_FEEDBACK,
      body: req
    })
    .then(res => {
      feedback.value = ''
      closeModal()
    })
}
const onAfterLeave = () => {
  isLocked.value = false
  emits('dismiss')
}
</script>

<style lang="scss" scoped>
.feedback-modal {
  --style: fixed inset-0 z-100 bg-transparent flex-center transition-colors duration-250;
  &.appear {
    --style: bg-#0f141999;
  }
}

button {
  --style: 'hover:(scale-103 opacity-90) active:(scale-105) transition-all duration-250';
}

.modal-content {
  --style: bg-#f5f5f3 rounded-2 p-24px w-480px select-none mb-10;
  position: relative;

  .header {
    --style: flex justify-between items-center;
    span {
      --style: text-(13px #999999) line-height-18px;
    }

    button {
      --style: w-16px h-16px;
      img {
        --style: w-full;
      }
    }
  }

  .content {
    --style: mt-16px flex flex-col items-center justify-stretch;
    .title {
      --style: w-full text-(14px ellipsis #333333) line-height-21px font-medium overflow-hidden line-clamp-2 break-all;
    }

    .title + textarea {
      --style: mt-20px;
    }

    textarea {
      --style: w-full h-120px rounded-2 border-(1px solid #3333330d) text-(15px #0f1419) bg-#fcfcfc line-height-22px py-12px px-16px resize-none outline-none;

      &::placeholder,
      &::-webkit-input-placeholder {
        --style: text-(15px #999999);
      }
    }
  }

  .bottom {
    --style: mt-20px flex justify-end items-center;
    button {
      --style: flex-center w-100px h-40px bg-#16B998 rounded-2 text-(14px #ffffff) font-semibold line-height-40px transition-all duration-250;

      &.disabled {
        --style: 'bg-#ccc cursor-not-allowed hover:(scale-100)';
      }

      &:not(.disabled):hover {
        --style: bg-#14a689;
      }

      &:not(.disabled):active {
        --style: scale-105;
      }
    }
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
